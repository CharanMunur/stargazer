package templates

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/gif"
	"image/png"
	"math"
	"sort"
	"sync"

	"star/internal/github"

	"github.com/fogleman/gg"
	"golang.org/x/image/draw"
)

type OrbitTemplate struct{}

func NewOrbitTemplate() *OrbitTemplate {
	return &OrbitTemplate{}
}

func (o *OrbitTemplate) Name() string {
	return "orbit"
}

func (ot *OrbitTemplate) Render(data *github.RepoData, opts RenderOptions) ([]byte, error) {
	if data == nil {
		return nil, fmt.Errorf("data cannot be nil")
	}

	// Sort stargazers chronologically (oldest to newest)
	stargazers := make([]github.Stargazer, len(data.Stargazers))
	copy(stargazers, data.Stargazers)
	sort.Slice(stargazers, func(i, j int) bool {
		return stargazers[i].StarredAt.Before(stargazers[j].StarredAt)
	})

	limit := 50
	if len(stargazers) < limit {
		limit = len(stargazers)
	}

	// Download avatars concurrently
	avatarSize := 180
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

	// Owner avatar
	ownerAvatarIdx := 999
	if data.Owner != "" {
		wg.Add(1)
		go func() {
			defer wg.Done()
			url := fmt.Sprintf("https://github.com/%s.png", data.Owner)
			img := DownloadAndProcessAvatar(url, 90)
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
	if theme != "light" {
		theme = "dark"
	}

	if opts.Format == "png" {
		img := ot.renderFrame(59, 60, data.StarsCount, stargazers, limit, avatarMap, data.Owner, data.Name, ownerAvatarIdx, regularFont, boldFont, theme)
		var buf bytes.Buffer
		if err := png.Encode(&buf, img); err != nil {
			return nil, fmt.Errorf("png encode error: %w", err)
		}
		return buf.Bytes(), nil
	}

	// Animated GIF 3D Orbit Flow
	totalFrames := 65
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

			img := ot.renderFrame(frame, totalFrames, data.StarsCount, stargazers, limit, avatarMap, data.Owner, data.Name, ownerAvatarIdx, regularFont, boldFont, theme)
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

func (ot *OrbitTemplate) renderFrame(
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
	width := 1600
	height := 900
	dc := gg.NewContext(width, height)

	// Theme color assignments
	isDark := theme == "dark"

	if isDark {
		// Deep Space Black/Obsidian Background
		dc.SetHexColor("#0F0E10")
		dc.Clear()

		// Subtle radial orange glow
		glowGrad := gg.NewRadialGradient(800, 430, 50, 800, 430, 550)
		glowGrad.AddColorStop(0, color.NRGBA{232, 116, 67, 35})
		glowGrad.AddColorStop(0.6, color.NRGBA{242, 200, 121, 15})
		glowGrad.AddColorStop(1, color.NRGBA{15, 14, 16, 0})
		dc.SetFillStyle(glowGrad)
		dc.DrawCircle(800, 430, 550)
		dc.Fill()
	} else {
		// Clean White Background
		dc.SetHexColor("#FFFFFF")
		dc.Clear()

		// Subtle warm radial glow
		glowGrad := gg.NewRadialGradient(800, 430, 50, 800, 430, 550)
		glowGrad.AddColorStop(0, color.NRGBA{232, 116, 67, 20})
		glowGrad.AddColorStop(0.6, color.NRGBA{242, 200, 121, 10})
		glowGrad.AddColorStop(1, color.NRGBA{255, 255, 255, 0})
		dc.SetFillStyle(glowGrad)
		dc.DrawCircle(800, 430, 550)
		dc.Fill()
	}

	// 1. Top Left Header: Owner avatar + "owner / repo"
	headerY := 140.0
	headerX := 140.0

	ownerImg := avatarMap[ownerAvatarIdx]
	if ownerImg != nil {
		dc.DrawCircle(headerX, headerY, 48)
		if isDark {
			dc.SetHexColor("#342A27")
		} else {
			dc.SetHexColor("#E2E8F0")
		}
		dc.SetLineWidth(4)
		dc.Stroke()
		dc.DrawImageAnchored(ownerImg, int(headerX), int(headerY), 0.5, 0.5)
	} else {
		dc.DrawCircle(headerX, headerY, 45)
		if isDark {
			dc.SetHexColor("#2A1B17")
		} else {
			dc.SetHexColor("#F1F5F9")
		}
		dc.Fill()
	}

	// Owner text in regular, repo text in bold
	dc.LoadFontFace(regularFontPath, 52)
	if isDark {
		dc.SetHexColor("#B8AAA3")
	} else {
		dc.SetHexColor("#64748B")
	}
	ownerStr := owner + " / "
	wOwner, _ := dc.MeasureString(ownerStr)
	dc.DrawStringAnchored(ownerStr, headerX+65, headerY, 0.0, 0.5)

	dc.LoadFontFace(boldFontPath, 52)
	if isDark {
		dc.SetHexColor("#F5EDE7")
	} else {
		dc.SetHexColor("#000000")
	}
	dc.DrawStringAnchored(repo, headerX+65+wOwner, headerY, 0.0, 0.5)

	// 2. Motion & 3D Orbit Carousel Physics
	t := float64(frame) / float64(totalFrames-1)
	easeT := 1.0 + 1.2*math.Pow(t-1.0, 3) + 0.8*math.Pow(t-1.0, 2)

	centerX := 800.0
	centerY := 420.0
	baseSize := 160.0
	spacing := 240.0

	if count == 0 {
		count = 1
	}

	maxScroll := float64(count-1) * spacing
	scrollOffset := easeT * maxScroll

	type AvatarItem struct {
		idx   int
		x, y  float64
		scale float64
		dist  float64
		login string
	}

	items := make([]AvatarItem, 0, count)
	for i := 0; i < count; i++ {
		colX := centerX + float64(i)*spacing - scrollOffset
		dist := math.Abs(colX - centerX)

		if colX < -300.0 || colX > float64(width)+300.0 {
			continue
		}

		arcY := centerY - 25.0*math.Cos((colX-centerX)/500.0*math.Pi/2)
		scale := 0.70 + 0.65*math.Exp(-math.Pow(dist/340.0, 2))

		login := ""
		if i < len(stargazers) {
			login = stargazers[i].User.Login
		}

		items = append(items, AvatarItem{
			idx:   i,
			x:     colX,
			y:     arcY,
			scale: scale,
			dist:  dist,
			login: login,
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].dist > items[j].dist
	})

	for _, item := range items {
		curSize := baseSize * item.scale
		curSizeInt := int(math.Round(curSize))

		// Outer Ring for center focus
		if item.dist < 150.0 {
			dc.DrawCircle(item.x, item.y, curSize/2.0+6.0)
			dc.SetHexColor("#E87443")
			dc.SetLineWidth(5)
			dc.Stroke()
		} else {
			dc.DrawCircle(item.x, item.y, curSize/2.0+3.0)
			if isDark {
				dc.SetHexColor("#342A27")
			} else {
				dc.SetHexColor("#E2E8F0")
			}
			dc.SetLineWidth(3)
			dc.Stroke()
		}

		img := avatarMap[item.idx]
		if img != nil {
			simg := image.NewRGBA(image.Rect(0, 0, curSizeInt, curSizeInt))
			draw.ApproxBiLinear.Scale(simg, simg.Bounds(), img, img.Bounds(), draw.Src, nil)
			dc.DrawImageAnchored(simg, int(item.x), int(item.y), 0.5, 0.5)
		} else {
			dc.DrawCircle(item.x, item.y, curSize/2.0)
			if isDark {
				dc.SetHexColor("#2A1B17")
				dc.Fill()
				dc.SetHexColor("#F5EDE7")
			} else {
				dc.SetHexColor("#F1F5F9")
				dc.Fill()
				dc.SetHexColor("#64748B")
			}
			dc.LoadFontFace(boldFontPath, 44*item.scale)
			dc.DrawStringAnchored(GetInitials(item.login), item.x, item.y, 0.5, 0.5)
		}

		// Gold Star badge centered under avatar (NO PROFILE NAME HANDLE TEXT)
		starY := item.y + curSize/2.0 + 26.0
		drawYellowStar(dc, item.x, starY, 14.0*item.scale)
	}

	// 3. Bottom Right Star Count: "N stars"
	counterY := 760.0
	calcT := math.Min(1.0, math.Max(0.0, easeT))
	curStars := int(1.0 + calcT*float64(totalStars-1))
	if curStars > totalStars {
		curStars = totalStars
	}
	if curStars < 1 {
		curStars = 1
	}

	numStr := FormatComma(curStars)
	dc.LoadFontFace(boldFontPath, 130)
	wNum, _ := dc.MeasureString(numStr)

	dc.LoadFontFace(regularFontPath, 90)
	wLabel, _ := dc.MeasureString(" stars")

	totalW := wNum + wLabel
	startX := float64(width) - 140.0 - totalW

	// Primary Orange bold number
	dc.LoadFontFace(boldFontPath, 130)
	dc.SetHexColor("#E87443")
	dc.DrawStringAnchored(numStr, startX, counterY, 0.0, 0.5)

	// " stars" label text
	dc.LoadFontFace(regularFontPath, 90)
	if isDark {
		dc.SetHexColor("#F5EDE7")
	} else {
		dc.SetHexColor("#000000")
	}
	dc.DrawStringAnchored(" stars", startX+wNum, counterY+8.0, 0.0, 0.5)

	return dc.Image()
}
