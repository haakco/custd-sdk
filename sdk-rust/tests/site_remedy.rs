use custd_sdk::SiteRemedy;
use serde_json::Value;

const FIXTURE: &str = include_str!("../../contract-fixtures/site-page-tools.json");

// A rule Custd has no remedy shape for arrives without a kind, and must still decode.
#[test]
fn remedy_without_a_shape_decodes_without_a_kind() {
    let fixture: Value = serde_json::from_str(FIXTURE).expect("fixture");
    let remedy: SiteRemedy =
        serde_json::from_value(fixture["remedyUnknownRule"].clone()).expect("remedy");
    assert_eq!(remedy.kind, None);
    assert_eq!(
        serde_json::to_value(&remedy).expect("encode"),
        fixture["remedyUnknownRule"]
    );
}
