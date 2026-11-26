use custd_sdk::{TenantManifest, TenantManifestApplyResponse, TenantManifestReadiness};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api PUT /api/v1/admin/tenant-manifest/{tenantSlug}",
            "/api/v1/admin/tenant-manifest/t-1",
            |c| {
                drop(c.custd.apply_tenant_manifest(
                    "t-1",
                    &body::<TenantManifest>(r#"{}"#),
                    "key-0001",
                ))
            },
            round_trip::<TenantManifestApplyResponse>,
        ),
        row(
            "admin-api GET /api/v1/admin/tenant-manifest/{tenantSlug}/readiness",
            "/api/v1/admin/tenant-manifest/t-1/readiness",
            |c| drop(c.custd.get_tenant_manifest_readiness("t-1")),
            round_trip::<TenantManifestReadiness>,
        ),
    ]
}
