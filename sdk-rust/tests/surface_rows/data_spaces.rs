use custd_sdk::{
    DataSpace, DataSpaceCreateRequest, DataSpaceErasure, DataSpaceListResponse,
    DataSpaceUsageSummary, ProducerReservation, ProducerReservationClaimRequest,
    ProducerReservationCreateRequest, ProducerReservationListResponse,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/data-spaces",
            "/api/v1/data-spaces?parentCompanySlug=p-1",
            |c| drop(c.custd.list_data_spaces(Some("p-1"))),
            round_trip::<DataSpaceListResponse>,
        ),
        row(
            "admin-api POST /api/v1/data-spaces",
            "/api/v1/data-spaces?parentCompanySlug=p-1",
            |c| {
                drop(c.custd.create_data_space(
                    Some("p-1"),
                    &body::<DataSpaceCreateRequest>(r#"{"companyName":"x","slug":"x"}"#),
                ))
            },
            round_trip::<DataSpace>,
        ),
        row(
            "admin-api GET /api/v1/data-spaces/usage",
            "/api/v1/data-spaces/usage?parentCompanySlug=p-1",
            |c| drop(c.custd.get_data_space_usage(Some("p-1"))),
            round_trip::<DataSpaceUsageSummary>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/data-spaces/{slug}",
            "/api/v1/data-spaces/s-1?parentCompanySlug=p-1",
            |c| drop(c.custd.revoke_data_space("s-1", Some("p-1"))),
        ),
        row(
            "admin-api POST /api/v1/data-spaces/{slug}/erasure",
            "/api/v1/data-spaces/s-1/erasure?parentCompanySlug=p-1",
            |c| drop(c.custd.erase_data_space("s-1", Some("p-1"))),
            round_trip::<DataSpaceErasure>,
        ),
        row(
            "admin-api GET /api/v1/data-spaces/{slug}/erasure",
            "/api/v1/data-spaces/s-1/erasure?parentCompanySlug=p-1",
            |c| drop(c.custd.get_data_space_erasure("s-1", Some("p-1"))),
            round_trip::<DataSpaceErasure>,
        ),
        row(
            "admin-api GET /api/v1/data-spaces/{slug}/producer-reservations",
            "/api/v1/data-spaces/s-1/producer-reservations?parentCompanySlug=p-1",
            |c| drop(c.custd.list_producer_reservations("s-1", Some("p-1"))),
            round_trip::<ProducerReservationListResponse>,
        ),
        row(
            "admin-api POST /api/v1/data-spaces/{slug}/producer-reservations",
            "/api/v1/data-spaces/s-1/producer-reservations?parentCompanySlug=p-1",
            |c| {
                drop(c.custd.reserve_producer_reservation(
                    "s-1",
                    Some("p-1"),
                    &body::<ProducerReservationCreateRequest>(
                        r#"{"producerSlug":"x","ttlSeconds":1}"#,
                    ),
                ))
            },
            round_trip::<ProducerReservation>,
        ),
        row(
            "admin-api POST /api/v1/data-spaces/{slug}/producer-reservations/{producerSlug}/claim",
            "/api/v1/data-spaces/s-1/producer-reservations/p-1/claim?parentCompanySlug=p-1",
            |c| {
                drop(c.custd.claim_producer_reservation(
                    "s-1",
                    "p-1",
                    Some("p-1"),
                    &body::<ProducerReservationClaimRequest>(r#"{"claimedByClientId":"x"}"#),
                ))
            },
            round_trip::<ProducerReservation>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/data-spaces/{slug}/producer-reservations/{producerSlug}",
            "/api/v1/data-spaces/s-1/producer-reservations/p-1?parentCompanySlug=p-1",
            |c| {
                drop(
                    c.custd
                        .release_producer_reservation("s-1", "p-1", Some("p-1")),
                )
            },
        ),
    ]
}
