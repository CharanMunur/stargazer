package templates

import (
	"bytes"
	"image"
	"image/color"
	"image/gif"
	_ "image/jpeg"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/fogleman/gg"
	"golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

func resolveAssetPath(path string) string {
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

func FormatComma(n int) string {
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

func DownloadAndProcessAvatar(url string, size int) image.Image {
	if url == "" {
		return nil
	}
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

func GetInitials(login string) string {
	if len(login) >= 2 {
		return strings.ToUpper(login[:2])
	}
	if len(login) == 1 {
		return strings.ToUpper(login)
	}
	return "??"
}

func RgbaToPaletted(img image.Image) *image.Paletted {
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

func DrawSpacedText(dc *gg.Context, text string, x, y, spacing float64) {
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

func ApplyAlpha(src image.Image, alpha float64) image.Image {
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

func drawYellowStar(dc *gg.Context, cx, cy, radius float64) {
	rOuter := radius
	rInner := radius * 0.42
	points := 5

	dc.NewSubPath()
	for i := 0; i < points*2; i++ {
		r := rOuter
		if i%2 == 1 {
			r = rInner
		}
		angle := float64(i)*math.Pi/float64(points) - math.Pi/2
		px := cx + r*math.Cos(angle)
		py := cy + r*math.Sin(angle)
		if i == 0 {
			dc.MoveTo(px, py)
		} else {
			dc.LineTo(px, py)
		}
	}
	dc.ClosePath()
	dc.SetHexColor("#eab308")
	dc.Fill()
}

func easeOutBack(t float64) float64 {
	s := 1.25
	t = t - 1.0
	return 1.0 + (s+1.0)*math.Pow(t, 3) + s*math.Pow(t, 2)
}
