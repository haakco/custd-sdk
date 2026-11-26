use custd_sdk::{
    TenantStorageLocationCreateBody, TenantStorageLocationListResponse, TenantStorageLocationView,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/tenant-storage-locations",
            "/api/v1/tenant-storage-locations",
            |c| drop(c.custd.list_tenant_storage_locations()),
            round_trip::<TenantStorageLocationListResponse>,
        ),
        row(
            "admin-api POST /api/v1/tenant-storage-locations",
            "/api/v1/tenant-storage-locations",
            |c| {
                drop(c.custd.create_tenant_storage_location(
                    &body::<TenantStorageLocationCreateBody>(r#"{}"#),
                ))
            },
            round_trip::<TenantStorageLocationView>,
        ),
        row(
            "admin-api GET /api/v1/tenant-storage-locations/{id}",
            "/api/v1/tenant-storage-locations/7",
            |c| drop(c.custd.get_tenant_storage_location(7)),
            round_trip::<TenantStorageLocationView>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/tenant-storage-locations/{id}",
            "/api/v1/tenant-storage-locations/7",
            |c| drop(c.custd.revoke_tenant_storage_location(7)),
        ),
    ]
}
