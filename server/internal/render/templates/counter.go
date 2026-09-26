package templates

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/gif"
	"image/png"
	"os"
	"path/filepath"
	"sort"
	"sync"

	"star/internal/github"

	"github.com/fogleman/gg"
	"github.com/srwiley/oksvg"
	"github.com/srwiley/rasterx"
	"golang.org/x/image/draw"
)

var ringColors = []string{
	"#f97316", "#a78bfa", "#38bdf8", "#fb7185",
	"#34d399", "#818cf8", "#facc15", "#2dd4bf",
}

type CounterTemplate struct{}

func NewCounterTemplate() *CounterTemplate {
	return &CounterTemplate{}
}

func (t *CounterTemplate) Name() string {
	return "counter"
}

func resolveAsset(path string) string {
	if _, err := os.Stat(path); err == nil {
		return path
	}
	alt := filepath.Join("server", path)
	if _, err := os.Stat(alt); err == nil {
		return alt
	}
	return filepath.Join("..", "..", path)
}

func (ct *CounterTemplate) Render(data *github.RepoData, opts RenderOptions) ([]byte, error) {
	if data == nil {
		return nil, fmt.Errorf("data cannot be nil")
	}

	stargazers := make([]github.Stargazer, len(data.Stargazers))
	copy(stargazers, data.Stargazers)
	sort.Slice(stargazers, func(i, j int) bool {
		return stargazers[i].StarredAt.After(stargazers[j].StarredAt)
	})

	title := fmt.Sprintf("%s/%s", data.Owner, data.Name)

	stars := data.StarsCount
	forks := data.ForksCount
	days := data.DaysCount

	// Rasterize SVG (Original logic)
	sw := 140
	leafImg := image.NewRGBA(image.Rect(0, 0, sw, 280))
	leafPath := resolveAsset("assets/svg/leaf.svg")
	icon, err := oksvg.ReadIcon(leafPath, oksvg.IgnoreErrorMode)
	if err == nil {
		sh := int(float64(icon.ViewBox.H) * (float64(sw) / float64(icon.ViewBox.W)))
		leafImg = image.NewRGBA(image.Rect(0, 0, sw, sh))
		icon.SetTarget(0, 0, float64(sw), float64(sh))
		scanner := rasterx.NewScannerGV(sw, sh, leafImg, leafImg.Bounds())
		dasher := rasterx.NewDasher(sw, sh, scanner)
		icon.Draw(dasher, 1.0)
		for y := 0; y < sh; y++ {
			for x := 0; x < sw; x++ {
				c := leafImg.RGBAAt(x, y)
				if c.A > 0 {
					progress := float64(y) / float64(sh)
					maskAlpha := 1.0
					if progress > 0.55 {
						maskAlpha = 1.0 - (progress-0.55)/0.45
					}
					newA := uint8(float64(c.A) * 0.15 * maskAlpha)
					leafImg.SetRGBA(x, y, color.RGBA{0, 0, 0, newA})
				}
			}
		}
	}

	leftLeaf := image.NewRGBA(leafImg.Bounds())
	for y := 0; y < leftLeaf.Bounds().Dy(); y++ {
		for x := 0; x < leftLeaf.Bounds().Dx(); x++ {
			leftLeaf.SetRGBA(x, y, leafImg.RGBAAt(sw-1-x, y))
		}
	}

	// Fetch Avatars
	avatarSize := 140
	avatarMap := make(map[int]image.Image)
	var wgAvatars sync.WaitGroup
	var mu sync.Mutex

	limit := 32
	if len(stargazers) < limit {
		limit = len(stargazers)
	}

	for i := 0; i < limit; i++ {
		wgAvatars.Add(1)
		go func(idx int, url string) {
			defer wgAvatars.Done()
			img := DownloadAndProcessAvatar(url, avatarSize)
			if img != nil {
				mu.Lock()
				avatarMap[idx] = img
				mu.Unlock()
			}
		}(i, stargazers[i].User.AvatarURL)
	}
	wgAvatars.Wait()

	boldFont := resolveAsset("assets/fonts/DMSans-Bold.ttf")
	regularFont := resolveAsset("assets/fonts/DMSans-Regular.ttf")

	dcMeasure := gg.NewContext(1, 1)
	dcMeasure.LoadFontFace(boldFont, 96)
	tw, _ := dcMeasure.MeasureString(title)

	if opts.Format == "png" {
		img := ct.renderFrame(60, stars, forks, days, stargazers, avatarMap, leftLeaf, leafImg, title, tw, regularFont, boldFont)
		var buf bytes.Buffer
		if err := png.Encode(&buf, img); err != nil {
			return nil, fmt.Errorf("png encode error: %w", err)
		}
		return buf.Bytes(), nil
	}

	totalFrames := 75
	animFrames := 60
	frames := make([]*image.Paletted, totalFrames)
	delays := make([]int, totalFrames)

	var wg sync.WaitGroup
	sem := make(chan struct{}, 6)

	for i := 0; i <= animFrames; i++ {
		wg.Add(1)
		go func(frame int) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			img := ct.renderFrame(frame, stars, forks, days, stargazers, avatarMap, leftLeaf, leafImg, title, tw, regularFont, boldFont)
			frames[frame] = RgbaToPaletted(img)
			delays[frame] = 4
		}(i)
	}
	wg.Wait()

	for i := animFrames + 1; i < totalFrames; i++ {
		frames[i] = frames[animFrames]
		delays[i] = 4
	}

	var buf bytes.Buffer
	err = gif.EncodeAll(&buf, &gif.GIF{
		Image:     frames,
		Delay:     delays,
		LoopCount: -1,
	})
	if err != nil {
		return nil, fmt.Errorf("gif encode error: %w", err)
	}

	return buf.Bytes(), nil
}

func (ct *CounterTemplate) renderFrame(
	frame int,
	stars, forks, days int,
	stargazers []github.Stargazer,
	avatarMap map[int]image.Image,
	leftLeaf, leafImg image.Image,
	title string,
	tw float64,
	regularFontPath, boldFontPath string,
) image.Image {
	dc := gg.NewContext(1600, 1156)
	dc.SetHexColor("#edecea")
	dc.Clear()

	t := float64(frame) / 60.0
	if t > 1.0 {
		t = 1.0
	}
	easeOut := func(t float64) float64 {
		return 1.0 - (1.0-t)*(1.0-t)*(1.0-t)
	}

	// 1. Laurels and Title fade/slide in
	tTitle := t / 0.25
	if tTitle > 1.0 {
		tTitle = 1.0
	}
	tTitle = easeOut(tTitle)

	titleY := 250.0 + 50.0*(1.0-tTitle)

	if tTitle > 0 {
		currLeft := ApplyAlpha(leftLeaf, tTitle)
		currRight := ApplyAlpha(leafImg, tTitle)

		leafGap := 50.0
		leftX := 800.0 - tw/2.0 - leafGap - float64(leftLeaf.Bounds().Dx())
		rightX := 800.0 + tw/2.0 + leafGap
		laurelY := int(titleY) - 190

		dc.DrawImage(currLeft, int(leftX), laurelY)
		dc.DrawImage(currRight, int(rightX), laurelY)
	}

	dc.LoadFontFace(regularFontPath, 34)
	dc.SetRGBA255(85, 85, 85, int(255*tTitle))
	DrawSpacedText(dc, "STARGAZERS · 2026", 800, titleY-90, 6)

	dc.LoadFontFace(boldFontPath, 96)
	dc.SetRGBA255(17, 17, 17, int(255*tTitle))
	dc.DrawStringAnchored(title, 800, titleY, 0.5, 0.5)

	// 2. Counters animate from 0 to target
	tCount := (t - 0.1) / 0.5
	if tCount < 0 {
		tCount = 0
	}
	if tCount > 1 {
		tCount = 1
	}
	tCount = easeOut(tCount)

	curStars := int(float64(stars) * tCount)
	curForks := int(float64(forks) * tCount)
	curDays := int(float64(days) * tCount)

	if tCount > 0 {
		dc.SetRGBA255(17, 17, 17, int(255*tCount))
		dc.LoadFontFace(regularFontPath, 160)
		dc.DrawStringAnchored(FormatComma(curStars), 400, 480, 0.5, 0.5)
		dc.DrawStringAnchored(FormatComma(curForks), 800, 480, 0.5, 0.5)
		dc.DrawStringAnchored(FormatComma(curDays), 1200, 480, 0.5, 0.5)

		dc.SetRGBA255(136, 136, 136, int(255*tCount))
		dc.LoadFontFace(regularFontPath, 26)
		DrawSpacedText(dc, "STARS", 400, 600, 8)
		DrawSpacedText(dc, "FORKS", 800, 600, 8)
		DrawSpacedText(dc, "DAYS", 1200, 600, 8)
	}

	// 3. Avatars staggered pop-in
	tAvatar := (t - 0.2) / 0.8
	if tAvatar < 0 {
		tAvatar = 0
	}
	if tAvatar > 1 {
		tAvatar = 1
	}

	avatarSize := 140
	ringPadding := 6.0
	gapX := 50.0
	gapY := 55.0
	startX := 800.0 - (8*float64(avatarSize)+7*gapX)/2.0 + float64(avatarSize)/2.0
	startY := 740.0

	dc.LoadFontFace(boldFontPath, 40)
	limit := 32
	if len(stargazers) < limit {
		limit = len(stargazers)
	}

	for i := 0; i < limit; i++ {
		startT := float64(i) / float64(limit) * 0.8
		if tAvatar < startT {
			continue
		}

		localT := (tAvatar - startT) / 0.2
		if localT > 1 {
			localT = 1
		}
		localT = easeOut(localT)

		row := i / 8
		col := i % 8
		x := startX + float64(col)*(float64(avatarSize)+gapX)
		y := startY + float64(row)*(float64(avatarSize)+gapY)

		curSize := float64(avatarSize) * localT
		if curSize < 1 {
			continue
		}

		dc.DrawCircle(x, y, curSize/2+ringPadding)
		dc.SetHexColor(ringColors[i%len(ringColors)])
		dc.SetLineWidth(5 * localT)
		dc.Stroke()

		img := avatarMap[i]
		if localT >= 0.99 {
			if img != nil {
				dc.DrawImageAnchored(img, int(x), int(y), 0.5, 0.5)
			} else {
				dc.DrawCircle(x, y, float64(avatarSize)/2)
				dc.SetHexColor("#e2e2e2")
				dc.Fill()
				dc.SetHexColor("#666666")
				initials := GetInitials(stargazers[i].User.Login)
				dc.DrawStringAnchored(initials, x, y, 0.5, 0.5)
			}
		} else {
			if img != nil {
				curSizeInt := int(curSize)
				if curSizeInt > 0 {
					simg := image.NewRGBA(image.Rect(0, 0, curSizeInt, curSizeInt))
					draw.ApproxBiLinear.Scale(simg, simg.Bounds(), img, img.Bounds(), draw.Src, nil)
					dc.DrawImageAnchored(simg, int(x), int(y), 0.5, 0.5)
				}
			} else {
				dc.DrawCircle(x, y, curSize/2)
				dc.SetHexColor("#e2e2e2")
				dc.Fill()
			}
		}
	}

	grad := gg.NewLinearGradient(0, 1156-300, 0, 1156)
	grad.AddColorStop(0, color.NRGBA{237, 236, 234, 0})
	grad.AddColorStop(1, color.NRGBA{237, 236, 234, 255})
	dc.SetFillStyle(grad)
	dc.DrawRectangle(0, 1156-300, 1600, 300)
	dc.Fill()

	return dc.Image()
}
