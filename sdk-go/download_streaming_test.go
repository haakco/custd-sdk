package custd

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"strconv"
	"sync/atomic"
	"testing"
	"time"
)

// streamingTransport answers with a body whose second half is only written once the caller's
// writer has received the first, so a client that buffers the whole body before writing never
// finishes.
type streamingTransport struct {
	first, second string
	delivered     chan struct{}
	closed        atomic.Bool
}

func (s *streamingTransport) Do(req *http.Request) (*http.Response, error) {
	reader, writer := io.Pipe()
	go func() {
		_, _ = io.WriteString(writer, s.first)
		select {
		case <-s.delivered:
			_, _ = io.WriteString(writer, s.second)
			_ = writer.Close()
		case <-time.After(2 * time.Second):
			_ = writer.CloseWithError(io.ErrUnexpectedEOF)
		}
	}()
	sum := sha256.Sum256([]byte(s.first + s.second))
	header := http.Header{}
	header.Set("Content-Length", strconv.Itoa(len(s.first)+len(s.second)))
	header.Set("X-Checksum-SHA256", hex.EncodeToString(sum[:]))
	return &http.Response{StatusCode: http.StatusOK, Header: header, Body: closeRecorder{reader, &s.closed}, Request: req}, nil
}

type closeRecorder struct {
	io.Reader
	closed *atomic.Bool
}

func (c closeRecorder) Close() error {
	c.closed.Store(true)
	return nil
}

// signalWriter reports the first write, which is the proof the body reached it as a stream.
type signalWriter struct {
	written   []byte
	delivered chan struct{}
}

func (w *signalWriter) Write(p []byte) (int, error) {
	if len(w.written) == 0 {
		close(w.delivered)
	}
	w.written = append(w.written, p...)
	return len(p), nil
}

func TestDownloadsStreamThroughACustomHTTPClient(t *testing.T) {
	downloads := map[string]func(*CustdClient, io.Writer) error{
		"offboarding bundle": func(c *CustdClient, w io.Writer) error {
			_, err := c.Admin.Offboarding.Download(context.Background(), "request-1", w)
			return err
		},
		"audit export": func(c *CustdClient, w io.Writer) error {
			_, err := c.Admin.Audit.ExportEvents(context.Background(), AuditListOptions{}, AuditExportFormatCSV, w)
			return err
		},
	}
	for name, download := range downloads {
		t.Run(name, func(t *testing.T) {
			delivered := make(chan struct{})
			transport := &streamingTransport{first: "first half,", second: "second half", delivered: delivered}
			client := NewClient(&ClientConfig{BaseURL: "http://localhost:8080", APIKey: "token", HTTPClient: transport, FlushInterval: time.Hour})
			t.Cleanup(func() { _ = client.Close(context.Background()) })
			writer := &signalWriter{delivered: delivered}
			if err := download(client, writer); err != nil {
				t.Fatalf("download: %v", err)
			}
			if string(writer.written) != "first half,second half" || !transport.closed.Load() {
				t.Fatalf("written %q, body closed %v", writer.written, transport.closed.Load())
			}
		})
	}
}
