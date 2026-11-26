package custd

import (
	"encoding/json"
	"testing"
)

// The server omits these fields when they carry no value, so the SDK must keep both shapes: a set
// value, including a real zero, is sent, and an unset one is left out rather than sent empty.
func TestOptionalWireFieldsMatchServerOmission(t *testing.T) {
	zero := 0.0
	cases := []struct {
		name  string
		value any
		key   string
		want  string
	}{
		{"resolved zero bound input", UncertaintyBoundInput{State: UncertaintyBoundInputStateResolved, Value: &zero}, "value", "0"},
		{"missing bound input", UncertaintyBoundInput{State: UncertaintyBoundInputStateValueMissing}, "value", ""},
		{"remedy without shape", AdminSiteRemedy{Element: "x"}, "kind", ""},
		{"last audit page", AuditListCursor{}, "cursor", ""},
		{"site create default identity", AdminSiteCreate{CompanySlug: "acme"}, "identityMode", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			encoded, err := json.Marshal(tc.value)
			if err != nil {
				t.Fatal(err)
			}
			var fields map[string]json.RawMessage
			if err := json.Unmarshal(encoded, &fields); err != nil {
				t.Fatal(err)
			}
			if got := string(fields[tc.key]); got != tc.want {
				t.Fatalf("%s = %q in %s, want %q", tc.key, got, encoded, tc.want)
			}
		})
	}
}
