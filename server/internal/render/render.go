package render

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/gif"
	"image/png"
	_ "image/jpeg"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"

	"star/internal/github"

	"github.com/fogleman/gg"
	"github.com/srwiley/oksvg"
	"github.com/srwiley/rasterx"
	"golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

var colors = []string{"#f97316", "#a78bfa", "#38bdf8", "#fb7185", "#34d399", "#818cf8", "#facc15", "#2dd4bf"}

func resolvePath(path string) string {
	if _, err := os.Stat(path); err == nil {
		return path
	}
	altPath := filepath.Join("server", path)
	if _, err := os.Stat(altPath); err == nil {
		return altPath
	}
	parentPath := filepath.Join("..", "..", path)
	if _, err := os.Stat(parentPath); err == nil {
		return parentPath
	}
	return path
}

func Render(data *github.RepoData) error {
	if data == nil {
		return fmt.Errorf("render received nil RepoData")
	}

	stargazers := make([]github.Stargazer, len(data.Stargazers))
	copy(stargazers, data.Stargazers)

	sort.Slice(stargazers, func(i, j int) bool {
		return stargazers[i].StarredAt.After(stargazers[j].StarredAt)
	})

	title := fmt.Sprintf("%s/%s", data.Owner, data.Name)

	// Rasterize SVG
	sw := 140
	leafImg := image.NewRGBA(image.Rect(0, 0, sw, 280))
	leafPath := resolvePath("assets/svg/leaf.svg")
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
	} else {
		fmt.Printf("Warning: could not read leaf SVG at %s: %v\n", leafPath, err)
	}

	leftLeaf := image.NewRGBA(leafImg.Bounds())
	for y := 0; y < leftLeaf.Bounds().Dy(); y++ {
		for x := 0; x < leftLeaf.Bounds().Dx(); x++ {
			leftLeaf.SetRGBA(x, y, leafImg.RGBAAt(sw-1-x, y))
		}
	}

	// Fetch Avatars
	fmt.Println("Downloading avatars...")
	avatarSize := 140
	type avatarResult struct {
		index int
		img   image.Image
	}
	results := make(chan avatarResult, 32)
	for i := 0; i < 32 && i < len(stargazers); i++ {
		go func(idx int, url string) {
			img := downloadAndProcessAvatar(url, avatarSize)
			results <- avatarResult{idx, img}
		}(i, stargazers[i].User.AvatarURL)
	}
	avatarMap := make(map[int]image.Image)
	for i := 0; i < 32 && i < len(stargazers); i++ {
		res := <-results
		avatarMap[res.index] = res.img
	}

	boldFontPath := resolvePath("assets/fonts/DMSans-Bold.ttf")
	regularFontPath := resolvePath("assets/fonts/DMSans-Regular.ttf")

	// Dummy context just to measure title
	dcMeasure := gg.NewContext(1, 1)
	dcMeasure.LoadFontFace(boldFontPath, 96)
	tw, _ := dcMeasure.MeasureString(title)

	// Render Static Final Frame
	fmt.Println("Rendering static output.png...")
	staticImg := renderFrame(60, data.StarsCount, data.ForksCount, data.DaysCount, stargazers, avatarMap, leftLeaf, leafImg, title, tw, regularFontPath, boldFontPath)
	outPng, err := os.Create("output.png")
	if err != nil {
		return fmt.Errorf("failed to create output.png: %w", err)
	}
	png.Encode(outPng, staticImg)
	outPng.Close()

	// Render GIF Animation
	fmt.Println("Rendering GIF frames...")
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

			img := renderFrame(frame, data.StarsCount, data.ForksCount, data.DaysCount, stargazers, avatarMap, leftLeaf, leafImg, title, tw, regularFontPath, boldFontPath)
			frames[frame] = rgbaToPaletted(img)
			delays[frame] = 4

			fmt.Printf("Rendered frame %d/%d\n", frame, animFrames)
		}(i)
	}
	wg.Wait()

	for i := animFrames + 1; i < totalFrames; i++ {
		frames[i] = frames[animFrames]
		delays[i] = 4
	}

	fmt.Println("Encoding output.gif...")
	outGif, err := os.Create("output.gif")
	if err != nil {
		return fmt.Errorf("failed to create output.gif: %w", err)
	}
	defer outGif.Close()

	err = gif.EncodeAll(outGif, &gif.GIF{
		Image:     frames,
		Delay:     delays,
		LoopCount: -1,
	})
	if err != nil {
		fmt.Println("GIF Encode Error:", err)
	}

	fmt.Println("Done!")
	return nil
}

func renderFrame(
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
		currLeft := applyAlpha(leftLeaf, tTitle)
		currRight := applyAlpha(leafImg, tTitle)

		leafGap := 50.0
		leftX := 800.0 - tw/2.0 - leafGap - float64(leftLeaf.Bounds().Dx())
		rightX := 800.0 + tw/2.0 + leafGap
		laurelY := int(titleY) - 190

		dc.DrawImage(currLeft, int(leftX), laurelY)
		dc.DrawImage(currRight, int(rightX), laurelY)
	}

	dc.LoadFontFace(regularFontPath, 34)
	dc.SetRGBA255(85, 85, 85, int(255*tTitle))
	drawSpacedText(dc, "STARGAZERS · 2026", 800, titleY-90, 6)

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
		dc.DrawStringAnchored(formatComma(curStars), 400, 480, 0.5, 0.5)
		dc.DrawStringAnchored(formatComma(curForks), 800, 480, 0.5, 0.5)
		dc.DrawStringAnchored(formatComma(curDays), 1200, 480, 0.5, 0.5)

		dc.SetRGBA255(136, 136, 136, int(255*tCount))
		dc.LoadFontFace(regularFontPath, 26)
		drawSpacedText(dc, "STARS", 400, 600, 8)
		drawSpacedText(dc, "FORKS", 800, 600, 8)
		drawSpacedText(dc, "DAYS", 1200, 600, 8)
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
	for i := 0; i < 32 && i < len(stargazers); i++ {
		startT := float64(i) / 32.0 * 0.8
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
		dc.SetHexColor(colors[i%len(colors)])
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
				initials := getInitials(stargazers[i].User.Login)
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

func rgbaToPaletted(img image.Image) *image.Paletted {
	var buf bytes.Buffer
	err := gif.Encode(&buf, img, &gif.Options{NumColors: 256})
	if err == nil {
		if decoded, err := gif.Decode(&buf); err == nil {
			if paletted, ok := decoded.(*image.Paletted); ok {
				return paletted
			}
		}
	}
	bounds := img.Bounds()
	pm := image.NewPaletted(bounds, color.Palette{
		color.RGBA{237, 236, 234, 255}, color.RGBA{17, 17, 17, 255}, color.RGBA{136, 136, 136, 255},
	})
	draw.FloydSteinberg.Draw(pm, bounds, img, image.Point{})
	return pm
}

func applyAlpha(src image.Image, alpha float64) image.Image {
	if alpha >= 0.99 {
		return src
	}
	bounds := src.Bounds()
	dst := image.NewRGBA(bounds)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, a := src.At(x, y).RGBA()
			newA := uint32(float64(a) * alpha)
			if newA > 65535 {
				newA = 65535
			}
			newR := uint32(float64(r) * alpha)
			newG := uint32(float64(g) * alpha)
			newB := uint32(float64(b) * alpha)
			dst.Set(x, y, color.RGBA64{uint16(newR), uint16(newG), uint16(newB), uint16(newA)})
		}
	}
	return dst
}

func drawSpacedText(dc *gg.Context, text string, x, y, spacing float64) {
	w := 0.0
	for _, c := range text {
		cw, _ := dc.MeasureString(string(c))
		w += cw + spacing
	}
	w -= spacing
	startX := x - w/2
	for _, c := range text {
		dc.DrawStringAnchored(string(c), startX, y, 0, 0.5)
		cw, _ := dc.MeasureString(string(c))
		startX += cw + spacing
	}
}

func formatComma(n int) string {
	in := strconv.Itoa(n)
	var out []byte
	for i := 0; i < len(in); i++ {
		if i > 0 && (len(in)-i)%3 == 0 {
			out = append(out, ',')
		}
		out = append(out, in[i])
	}
	return string(out)
}

func downloadAndProcessAvatar(url string, size int) image.Image {
	resp, err := http.Get(url)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()
	src, _, err := image.Decode(resp.Body)
	if err != nil {
		return nil
	}

	dc := gg.NewContext(size, size)
	dc.DrawCircle(float64(size)/2, float64(size)/2, float64(size)/2)
	dc.Clip()

	bounds := src.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	scale := float64(size) / float64(w)
	if float64(size)/float64(h) > scale {
		scale = float64(size) / float64(h)
	}
	newW, newH := int(float64(w)*scale), int(float64(h)*scale)

	scaled := image.NewRGBA(image.Rect(0, 0, newW, newH))
	draw.CatmullRom.Scale(scaled, scaled.Bounds(), src, src.Bounds(), draw.Src, nil)
	dc.DrawImageAnchored(scaled, size/2, size/2, 0.5, 0.5)
	return dc.Image()
}

func getInitials(login string) string {
	if len(login) >= 2 {
		return strings.ToUpper(login[:2])
	}
	if len(login) == 1 {
		return strings.ToUpper(login)
	}
	return ""
}
