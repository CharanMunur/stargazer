package templates

import (
	"bytes"
	"fmt"
	"image"
	"image/gif"
	"image/png"
	"math"
	"math/rand"
	"sort"
	"sync"

	"star/internal/github"

	"github.com/fogleman/gg"
	"golang.org/x/image/draw"
)

type ConstellationTemplate struct{}

func NewConstellationTemplate() *ConstellationTemplate {
	return &ConstellationTemplate{}
}

func (c *ConstellationTemplate) Name() string {
	return "constellation"
}

type ConstellationAvatar struct {
	x, y  float64
	size  float64
	alpha float64
}

// generateConstellationScatter computes non-overlapping avatars placed outside a horizontal whitespace oval
func generateConstellationScatter(count int, width, height float64, repoSeed string) []ConstellationAvatar {
	var seed int64 = 42
	for _, ch := range repoSeed {
		seed = seed*31 + int64(ch)
	}
	rng := rand.New(rand.NewSource(seed))

	centerX := width / 2.0
	centerY := height / 2.0

	// Oval whitespace radii around text, logo, and star count (Horizontal Ellipse)
	rx := 560.0 // Horizontal whitespace around text
	ry := 240.0 // Vertical whitespace around stacked logo & text

	// Max elliptical distance at canvas corner (1600, 900)
	maxDEll := math.Sqrt(math.Pow(centerX/rx, 2) + math.Pow(centerY/ry, 2)) // ~2.23

	result := make([]ConstellationAvatar, 0, count)
	maxAttempts := 90000
	attempts := 0

	for len(result) < count && attempts < maxAttempts {
		attempts++

		margin := 50.0
		x := margin + rng.Float64()*(width-2*margin)
		y := margin + rng.Float64()*(height-2*margin)

		dx := (x - centerX) / rx
		dy := (y - centerY) / ry
		dEll := math.Sqrt(dx*dx + dy*dy)

		// 1. Must be outside the horizontal whitespace oval around text & logo
		if dEll < 1.0 {
			continue
		}

		// 2. Outer / Corner density bias
		uDist := (dEll - 1.0) / (maxDEll - 1.0)
		prob := 0.25 + 0.75*math.Pow(uDist, 0.60)
		if rng.Float64() > prob {
			continue
		}

		// 3. Avatar size variation (larger size range: 78px to 120px)
		size := 78.0 + rng.Float64()*42.0

		// 4. Overlap rejection check (prevent touching/overlapping avatars)
		padding := 20.0
		overlapping := false
		for _, existing := range result {
			edx := x - existing.x
			edy := y - existing.y
			edist := math.Sqrt(edx*edx + edy*edy)
			minGap := (size / 2.0) + (existing.size / 2.0) + padding
			if edist < minGap {
				overlapping = true
				break
			}
		}

		if overlapping {
			continue
		}

		// 5. Reduced fade intensity: subtle opacity falloff from 0.35 at boundary -> 1.0 (bright/clear) at corners
		uOpacity := math.Min(1.0, math.Max(0.0, uDist))
		alpha := 0.35 + 0.65*math.Pow(uOpacity, 1.1)

		result = append(result, ConstellationAvatar{
			x:     x,
			y:     y,
			size:  size,
			alpha: alpha,
		})
	}

	return result
}

func (ct *ConstellationTemplate) Render(data *github.RepoData, opts RenderOptions) ([]byte, error) {
	if data == nil {
		return nil, fmt.Errorf("data cannot be nil")
	}

	stargazers := make([]github.Stargazer, len(data.Stargazers))
	copy(stargazers, data.Stargazers)
	sort.Slice(stargazers, func(i, j int) bool {
		return stargazers[i].StarredAt.Before(stargazers[j].StarredAt)
	})

	limit := 50
	if len(stargazers) < limit {
		limit = len(stargazers)
	}

	avatarSize := 130
	avatarMap := make(map[int]image.Image)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for i := 0; i < limit; i++ {
		wg.Add(1)
		go func(idx int, url string) {
			defer wg.Done()
			img := DownloadAndProcessAvatar(url, avatarSize)
			if img != nil {
				mu.Lock()
				avatarMap[idx] = img
				mu.Unlock()
			}
		}(i, stargazers[i].User.AvatarURL)
	}

	ownerAvatarIdx := 999
	if data.Owner != "" {
		wg.Add(1)
		go func() {
			defer wg.Done()
			url := fmt.Sprintf("https://github.com/%s.png", data.Owner)
			img := DownloadAndProcessAvatar(url, 130)
			if img != nil {
				mu.Lock()
				avatarMap[ownerAvatarIdx] = img
				mu.Unlock()
			}
		}()
	}
	wg.Wait()

	boldFont := resolveAsset("assets/fonts/DMSans-Bold.ttf")
	regularFont := resolveAsset("assets/fonts/DMSans-Regular.ttf")

	theme := opts.Theme
	if theme != "dark" && theme != "light" {
		theme = "light"
	}

	if opts.Format == "png" {
		img := ct.renderFrame(59, 60, data.StarsCount, stargazers, limit, avatarMap, data.Owner, data.Name, ownerAvatarIdx, regularFont, boldFont, theme)
		var buf bytes.Buffer
		if err := png.Encode(&buf, img); err != nil {
			return nil, fmt.Errorf("png encode error: %w", err)
		}
		return buf.Bytes(), nil
	}

	// Animated GIF Constellation Cloud
	totalFrames := 60
	frames := make([]*image.Paletted, totalFrames)
	delays := make([]int, totalFrames)

	var wgAnim sync.WaitGroup
	sem := make(chan struct{}, 8)

	for i := 0; i < totalFrames; i++ {
		wgAnim.Add(1)
		go func(frame int) {
			defer wgAnim.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			img := ct.renderFrame(frame, totalFrames, data.StarsCount, stargazers, limit, avatarMap, data.Owner, data.Name, ownerAvatarIdx, regularFont, boldFont, theme)
			frames[frame] = RgbaToPaletted(img)
			delays[frame] = 4 // 25 fps
		}(i)
	}
	wgAnim.Wait()

	var buf bytes.Buffer
	err := gif.EncodeAll(&buf, &gif.GIF{
		Image:     frames,
		Delay:     delays,
		LoopCount: -1,
	})
	if err != nil {
		return nil, fmt.Errorf("gif encode error: %w", err)
	}

	return buf.Bytes(), nil
}

func (ct *ConstellationTemplate) renderFrame(
	frame, totalFrames int,
	totalStars int,
	stargazers []github.Stargazer,
	count int,
	avatarMap map[int]image.Image,
	owner, repo string,
	ownerAvatarIdx int,
	regularFontPath, boldFontPath string,
	theme string,
) image.Image {
	width := 1600.0
	height := 900.0
	dc := gg.NewContext(int(width), int(height))

	isDark := theme == "dark"

	if isDark {
		dc.SetHexColor("#0F0E10")
	} else {
		dc.SetHexColor("#FFFFFF")
	}
	dc.Clear()

	repoFullName := owner + "/" + repo
	scatters := generateConstellationScatter(count, width, height, repoFullName)

	t := float64(frame) / float64(totalFrames-1)

	// 1. Render Avatars Emerging From Whitespace Oval with Reduced Fade & Larger Sizes
	for i := 0; i < len(scatters) && i < count; i++ {
		scat := scatters[i]

		staggerDelay := (float64(i) / float64(count)) * 0.40
		avatarT := math.Min(1.0, math.Max(0.0, (t-staggerDelay)/0.30))

		if avatarT <= 0.001 {
			continue
		}

		s := 1.70158
		tSub := avatarT - 1.0
		easePop := 1.0 + (s+1.0)*tSub*tSub*tSub + s*tSub*tSub

		curScale := math.Min(1.0, math.Max(0.0, 0.65+0.35*easePop))
		curSize := scat.size * curScale
		curAlpha := scat.alpha * avatarT

		img := avatarMap[i]
		if img != nil {
			curSizeInt := int(math.Round(curSize))
			if curSizeInt < 1 {
				curSizeInt = 1
			}
			simg := image.NewRGBA(image.Rect(0, 0, curSizeInt, curSizeInt))
			draw.ApproxBiLinear.Scale(simg, simg.Bounds(), img, img.Bounds(), draw.Src, nil)

			alphaImg := ApplyAlpha(simg, curAlpha)
			dc.DrawImageAnchored(alphaImg, int(scat.x), int(scat.y), 0.5, 0.5)
		} else {
			dc.DrawCircle(scat.x, scat.y, curSize/2.0)
			if isDark {
				dc.SetRGBA(0.2, 0.2, 0.2, curAlpha)
			} else {
				dc.SetRGBA(0.9, 0.9, 0.9, curAlpha)
			}
			dc.Fill()
		}
	}

	// 2. CENTER CONTENT: Stacked Icon + Title + Plain Text Star Count
	centerX := width / 2.0
	centerY := height / 2.0

	centerT := math.Min(1.0, math.Max(0.0, t/0.30))
	easeCenter := 1.0 - math.Pow(1.0-centerT, 3)

	avatarY := centerY - 110.0
	titleY := centerY + 10.0
	countY := centerY + 90.0

	// 2a. Owner/Mascot Avatar Icon (Centered top)
	ownerImg := avatarMap[ownerAvatarIdx]
	if ownerImg != nil {
		iconRadius := 50.0 * (0.80 + 0.20*easeCenter)
		dc.DrawCircle(centerX, avatarY, iconRadius)
		if isDark {
			dc.SetHexColor("#342A27")
		} else {
			dc.SetHexColor("#E2E8F0")
		}
		dc.SetLineWidth(3)
		dc.Stroke()

		iconSizeInt := int(math.Round(iconRadius * 2.0))
		simg := image.NewRGBA(image.Rect(0, 0, iconSizeInt, iconSizeInt))
		draw.ApproxBiLinear.Scale(simg, simg.Bounds(), ownerImg, ownerImg.Bounds(), draw.Src, nil)
		alphaOwnerImg := ApplyAlpha(simg, easeCenter)
		dc.DrawImageAnchored(alphaOwnerImg, int(centerX), int(avatarY), 0.5, 0.5)
	}

	// 2b. "username / repo" Title Text (Centered middle)
	dc.LoadFontFace(boldFontPath, 72)
	if isDark {
		dc.SetRGBA(0.96, 0.93, 0.91, easeCenter)
	} else {
		dc.SetRGBA(0.05, 0.05, 0.05, easeCenter)
	}
	repoTitle := repoFullName
	if owner == "" {
		repoTitle = repo
	}
	dc.DrawStringAnchored(repoTitle, centerX, titleY, 0.5, 0.5)

	// 2c. Plain Text Star Count: "N stars" (Centered bottom)
	curStars := int(1.0 + easeCenter*float64(totalStars-1))
	if curStars > totalStars {
		curStars = totalStars
	}

	starText := FormatComma(curStars) + " stars"
	dc.LoadFontFace(regularFontPath, 44)
	if isDark {
		dc.SetRGBA(0.70, 0.65, 0.62, easeCenter)
	} else {
		dc.SetRGBA(0.40, 0.40, 0.40, easeCenter)
	}
	dc.DrawStringAnchored(starText, centerX, countY, 0.5, 0.5)

	return dc.Image()
}
