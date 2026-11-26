use custd_sdk::{
    DataSpaceEntitlementState, DataSpaceEntitlementUpdateRequest, StorageLimit,
    StorageLimitUpdateRequest, Tenant, TenantCreateRequest, TenantListResponse,
};

use super::{body, round_trip};
use crate::{Row, bodiless, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/tenants",
            "/api/v1/admin/tenants",
            |c| drop(c.custd.list_tenants()),
            round_trip::<TenantListResponse>,
        ),
        row(
            "admin-api POST /api/v1/admin/tenants",
            "/api/v1/admin/tenants",
            |c| {
                drop(c.custd.create_tenant(&body::<TenantCreateRequest>(
                    r#"{"companyName":"x","slug":"x"}"#,
                )))
            },
            round_trip::<Tenant>,
        ),
        row(
            "admin-api GET /api/v1/admin/tenants/{slug}",
            "/api/v1/admin/tenants/s-1",
            |c| drop(c.custd.get_tenant("s-1")),
            round_trip::<Tenant>,
        ),
        bodiless(
            "admin-api DELETE /api/v1/admin/tenants/{slug}",
            "/api/v1/admin/tenants/s-1",
            |c| drop(c.custd.delete_tenant("s-1")),
        ),
        bodiless(
            "admin-api POST /api/v1/admin/tenants/{slug}/finalize",
            "/api/v1/admin/tenants/s-1/finalize?companyId=7",
            |c| drop(c.custd.finalize_tenant("s-1", 7)),
        ),
        row(
            "admin-api PUT /api/v1/admin/tenants/{slug}/storage-limit",
            "/api/v1/admin/tenants/s-1/storage-limit",
            |c| {
                drop(c.custd.update_storage_limit("s-1", &body::<StorageLimitUpdateRequest>(r#"{"hardLimitEnabled":true,"includedStorageBytes":1,"purchasedStorageBytes":1,"warnPercent":1}"#)))
            },
            round_trip::<StorageLimit>,
        ),
        row(
            "admin-api GET /api/v1/admin/tenants/{slug}/data-space-entitlement",
            "/api/v1/admin/tenants/s-1/data-space-entitlement",
            |c| drop(c.custd.get_data_space_entitlement("s-1")),
            round_trip::<DataSpaceEntitlementState>,
        ),
        row(
            "admin-api PUT /api/v1/admin/tenants/{slug}/data-space-entitlement",
            "/api/v1/admin/tenants/s-1/data-space-entitlement",
            |c| {
                drop(c.custd.update_data_space_entitlement("s-1", &body::<DataSpaceEntitlementUpdateRequest>(r#"{"enabled":true,"maxActiveDataSpaces":1,"maxActiveProducersPerDataSpace":1}"#)))
            },
            round_trip::<DataSpaceEntitlementState>,
        ),
    ]
}
