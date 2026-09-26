package github

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

var (
	ErrUnauthorized = errors.New("invalid or expired GitHub token")
	ErrNotFound     = errors.New("repository not found or private without access")
	ErrRateLimited  = errors.New("github API rate limit exceeded")
)

type User struct {
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
	HTMLURL   string `json:"html_url"`
}

type Stargazer struct {
	StarredAt time.Time `json:"starred_at"`
	User      User      `json:"user"`
}

type rawStargazer struct {
	StarredAt string `json:"starred_at"`
	User      User   `json:"user"`
}

type rawRepo struct {
	Name            string `json:"name"`
	StargazersCount int    `json:"stargazers_count"`
	ForksCount      int    `json:"forks_count"`
	Owner           struct {
		Login string `json:"login"`
	} `json:"owner"`
}

type RepoData struct {
	Owner      string      `json:"owner"`
	Name       string      `json:"name"`
	ForksCount int         `json:"forks_count"`
	StarsCount int         `json:"stars_count"`
	DaysCount  int         `json:"days_count"`
	Stargazers []Stargazer `json:"stargazers"`
}

type Client struct {
	HTTPClient *http.Client
	Token      string
}

func NewClient(token string) *Client {
	return &Client{
		HTTPClient: &http.Client{Timeout: 15 * time.Second},
		Token:      token,
	}
}

func (c *Client) FetchRepoData(owner, repo string) (*RepoData, error) {
	if owner == "" || repo == "" {
		return nil, fmt.Errorf("owner and repo must be provided")
	}

	// 1. Fetch Repo Metadata (forks, stars_count, owner name)
	repoURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)
	req, err := http.NewRequest("GET", repoURL, nil)
	if err != nil {
		return nil, err
	}
	c.setHeaders(req, "application/vnd.github.v3+json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch repo: %w", err)
	}
	defer resp.Body.Close()

	if err := c.checkResponseStatus(resp); err != nil {
		return nil, err
	}

	var r rawRepo
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, fmt.Errorf("failed to decode repo response: %w", err)
	}

	// 2. Paginate & Fetch Stargazers list (with timestamp preview header)
	var allStargazers []Stargazer
	var oldestStar time.Time

	for page := 1; page <= 10; page++ { // Up to 1,000 stargazers max
		stargazersURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/stargazers?per_page=100&page=%d", owner, repo, page)
		reqStars, err := http.NewRequest("GET", stargazersURL, nil)
		if err != nil {
			return nil, err
		}
		c.setHeaders(reqStars, "application/vnd.github.star+json")

		respStars, err := c.HTTPClient.Do(reqStars)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch stargazers page %d: %w", page, err)
		}

		if err := c.checkResponseStatus(respStars); err != nil {
			respStars.Body.Close()
			return nil, err
		}

		var rawStars []rawStargazer
		if err := json.NewDecoder(respStars.Body).Decode(&rawStars); err != nil {
			respStars.Body.Close()
			return nil, fmt.Errorf("failed to decode stargazers page %d response: %w", page, err)
		}
		respStars.Body.Close()

		if len(rawStars) == 0 {
			break
		}

		for _, s := range rawStars {
			t, err := time.Parse(time.RFC3339, s.StarredAt)
			if err != nil {
				t = time.Now()
			}
			if oldestStar.IsZero() || t.Before(oldestStar) {
				oldestStar = t
			}
			allStargazers = append(allStargazers, Stargazer{
				StarredAt: t,
				User:      s.User,
			})
		}

		if len(rawStars) < 100 {
			break
		}
	}

	daysCount := 0
	if !oldestStar.IsZero() {
		daysCount = int(time.Since(oldestStar).Hours() / 24)
	}

	starsCount := r.StargazersCount
	if len(allStargazers) > starsCount {
		starsCount = len(allStargazers)
	}

	return &RepoData{
		Owner:      r.Owner.Login,
		Name:       r.Name,
		ForksCount: r.ForksCount,
		StarsCount: starsCount,
		DaysCount:  daysCount,
		Stargazers: allStargazers,
	}, nil
}

func (c *Client) setHeaders(req *http.Request, accept string) {
	req.Header.Set("Accept", accept)
	req.Header.Set("User-Agent", "Star-Card-Generator/1.0")
	if c.Token != "" {
		req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(c.Token))
	}
}

func (c *Client) checkResponseStatus(resp *http.Response) error {
	switch resp.StatusCode {
	case http.StatusOK:
		return nil
	case http.StatusUnauthorized:
		return ErrUnauthorized
	case http.StatusNotFound:
		return ErrNotFound
	case http.StatusForbidden:
		if resp.Header.Get("X-RateLimit-Remaining") == "0" {
			resetUnix, _ := strconv.ParseInt(resp.Header.Get("X-RateLimit-Reset"), 10, 64)
			resetTime := time.Unix(resetUnix, 0).Format(time.Kitchen)
			return fmt.Errorf("%w (resets at %s)", ErrRateLimited, resetTime)
		}
		return ErrNotFound
	default:
		return fmt.Errorf("github API error: HTTP %d", resp.StatusCode)
	}
}
