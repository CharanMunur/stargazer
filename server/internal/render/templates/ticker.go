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

type TickerTemplate struct{}

func NewTickerTemplate() *TickerTemplate {
	return &TickerTemplate{}
}

func (t *TickerTemplate) Name() string {
	return "ticker"
}

func (tt *TickerTemplate) Render(data *github.RepoData, opts RenderOptions) ([]byte, error) {
	if data == nil {
		return nil, fmt.Errorf("data cannot be nil")
	}

	// Sort stargazers chronologically (oldest to newest)
	stargazers := make([]github.Stargazer, len(data.Stargazers))
	copy(stargazers, data.Stargazers)
	sort.Slice(stargazers, func(i, j int) bool {
		return stargazers[i].StarredAt.Before(stargazers[j].StarredAt)
	})

	limit := 60
	if len(stargazers) < limit {
		limit = len(stargazers)
	}

	// Download avatars concurrently
	avatarSize := 160
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
	if theme != "dark" && theme != "light" {
		theme = "light"
	}

	if opts.Format == "png" {
		img := tt.renderFrame(59, 60, data.StarsCount, stargazers, limit, avatarMap, data.Owner, data.Name, ownerAvatarIdx, regularFont, boldFont, theme)
		var buf bytes.Buffer
		if err := png.Encode(&buf, img); err != nil {
			return nil, fmt.Errorf("png encode error: %w", err)
		}
		return buf.Bytes(), nil
	}

	// Animated GIF continuous marquee scroll
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

			img := tt.renderFrame(frame, totalFrames, data.StarsCount, stargazers, limit, avatarMap, data.Owner, data.Name, ownerAvatarIdx, regularFont, boldFont, theme)
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

func (tt *TickerTemplate) renderFrame(
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

	isDark := theme == "dark"

	if isDark {
		dc.SetHexColor("#0F0E10")
	} else {
		dc.SetHexColor("#FFFFFF")
	}
	dc.Clear()

	// 1. Top Left Header: Owner avatar + "owner / repo"
	headerY := 140.0
	headerX := 140.0

	ownerImg := avatarMap[ownerAvatarIdx]
	if ownerImg != nil {
		dc.DrawImageAnchored(ownerImg, int(headerX), int(headerY), 0.5, 0.5)
	} else {
		dc.DrawCircle(headerX, headerY, 45)
		if isDark {
			dc.SetHexColor("#2A1B17")
		} else {
			dc.SetHexColor("#E2E8F0")
		}
		dc.Fill()
	}

	// Owner text in regular, repo text in bold
	dc.LoadFontFace(regularFontPath, 56)
	if isDark {
		dc.SetHexColor("#B8AAA3")
	} else {
		dc.SetHexColor("#64748B")
	}
	ownerStr := owner + " / "
	wOwner, _ := dc.MeasureString(ownerStr)
	dc.DrawStringAnchored(ownerStr, headerX+65, headerY, 0.0, 0.5)

	dc.LoadFontFace(boldFontPath, 56)
	if isDark {
		dc.SetHexColor("#F5EDE7")
	} else {
		dc.SetHexColor("#000000")
	}
	dc.DrawStringAnchored(repo, headerX+65+wOwner, headerY, 0.0, 0.5)

	// 2. Physics & Motion Calculations with Spring Bounce Back
	t := float64(frame) / float64(totalFrames-1)
	easeT := easeOutBack(t)

	centerX := float64(width) / 2.0 // 800.0px (middle of screen)
	tickerY := 420.0
	baseAvatarSize := 160.0
	itemGap := 60.0
	itemWidth := baseAvatarSize + itemGap

	if count == 0 {
		count = 1
	}

	maxScroll := float64(count-1) * itemWidth
	scrollOffset := easeT * maxScroll

	for i := 0; i < count; i++ {
		colX := centerX + float64(i)*itemWidth - scrollOffset

		if colX < -250.0 || colX > float64(width)+250.0 {
			continue
		}

		distFromCenter := math.Abs(colX - centerX)
		scale := 1.0 + 0.35*math.Exp(-math.Pow(distFromCenter/320.0, 2))
		curSize := baseAvatarSize * scale

		// Subtle avatar border ring
		dc.DrawCircle(colX, tickerY, curSize/2.0+2.5)
		if isDark {
			dc.SetHexColor("#342A27")
		} else {
			dc.SetHexColor("#E2E8F0")
		}
		dc.SetLineWidth(3)
		dc.Stroke()

		img := avatarMap[i]
		if img != nil {
			curSizeInt := int(math.Round(curSize))
			simg := image.NewRGBA(image.Rect(0, 0, curSizeInt, curSizeInt))
			draw.ApproxBiLinear.Scale(simg, simg.Bounds(), img, img.Bounds(), draw.Src, nil)
			dc.DrawImageAnchored(simg, int(colX), int(tickerY), 0.5, 0.5)
		} else {
			dc.DrawCircle(colX, tickerY, curSize/2.0)
			if isDark {
				dc.SetHexColor("#2A1B17")
				dc.Fill()
				dc.SetHexColor("#F5EDE7")
			} else {
				dc.SetHexColor("#F1F5F9")
				dc.Fill()
				dc.SetHexColor("#64748B")
			}
			dc.LoadFontFace(boldFontPath, 44*scale)
			login := ""
			if i < len(stargazers) {
				login = stargazers[i].User.Login
			}
			dc.DrawStringAnchored(GetInitials(login), colX, tickerY, 0.5, 0.5)
		}

		// Small yellow 5-point star centered directly UNDER avatar
		starY := tickerY + curSize/2.0 + 26.0
		drawYellowStar(dc, colX, starY, 14.0*scale)
	}

	// Soft fade out on extreme left and right edges
	leftGrad := gg.NewLinearGradient(0, tickerY, 160, tickerY)
	if isDark {
		leftGrad.AddColorStop(0, color.NRGBA{15, 14, 16, 255})
		leftGrad.AddColorStop(1, color.NRGBA{15, 14, 16, 0})
	} else {
		leftGrad.AddColorStop(0, color.NRGBA{255, 255, 255, 255})
		leftGrad.AddColorStop(1, color.NRGBA{255, 255, 255, 0})
	}
	dc.SetFillStyle(leftGrad)
	dc.DrawRectangle(0, tickerY-160, 160, 320)
	dc.Fill()

	rightGrad := gg.NewLinearGradient(float64(width)-160, tickerY, float64(width), tickerY)
	if isDark {
		rightGrad.AddColorStop(0, color.NRGBA{15, 14, 16, 0})
		rightGrad.AddColorStop(1, color.NRGBA{15, 14, 16, 255})
	} else {
		rightGrad.AddColorStop(0, color.NRGBA{255, 255, 255, 0})
		rightGrad.AddColorStop(1, color.NRGBA{255, 255, 255, 255})
	}
	dc.SetFillStyle(rightGrad)
	dc.DrawRectangle(float64(width)-160, tickerY-160, 160, 320)
	dc.Fill()

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

	dc.LoadFontFace(boldFontPath, 130)
	if isDark {
		dc.SetHexColor("#F5EDE7")
	} else {
		dc.SetHexColor("#000000")
	}
	dc.DrawStringAnchored(numStr, startX, counterY, 0.0, 0.5)

	dc.LoadFontFace(regularFontPath, 90)
	if isDark {
		dc.SetHexColor("#B8AAA3")
	} else {
		dc.SetHexColor("#000000")
	}
	dc.DrawStringAnchored(" stars", startX+wNum, counterY+8.0, 0.0, 0.5)

	return dc.Image()
}
