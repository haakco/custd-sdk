use custd_sdk::{
    MachineAccessCompanyPolicy, MachineAccessCompanyUpdateRequest, MachineAccessEffective,
    MachineAccessMachinePolicy, MachineAccessMachineUpdateRequest,
};

use super::{body, round_trip};
use crate::{Row, row};

pub fn rows() -> Vec<Row> {
    vec![
        row(
            "admin-api GET /api/v1/admin/machine-access",
            "/api/v1/admin/machine-access?companySlug=acme",
            |c| drop(c.custd.get_machine_access(Some("acme"))),
            round_trip::<MachineAccessCompanyPolicy>,
        ),
        row(
            "admin-api PUT /api/v1/admin/machine-access",
            "/api/v1/admin/machine-access?companySlug=acme",
            |c| {
                drop(c.custd.update_machine_access(
                    &body::<MachineAccessCompanyUpdateRequest>(
                        r#"{"areas":[{"area":"reporting","state":"blocked"}]}"#,
                    ),
                    Some("acme"),
                ))
            },
            round_trip::<MachineAccessCompanyPolicy>,
        ),
        row(
            "admin-api GET /api/v1/admin/machine-access/clients/{clientId}",
            "/api/v1/admin/machine-access/clients/ci-1",
            |c| drop(c.custd.get_machine_access_override("ci-1")),
            round_trip::<MachineAccessMachinePolicy>,
        ),
        row(
            "admin-api PUT /api/v1/admin/machine-access/clients/{clientId}",
            "/api/v1/admin/machine-access/clients/ci-1",
            |c| {
                drop(c.custd.update_machine_access_override(
                    "ci-1",
                    &body::<MachineAccessMachineUpdateRequest>(
                        r#"{"areas":[{"area":"sites","state":"inherit"}]}"#,
                    ),
                ))
            },
            round_trip::<MachineAccessMachinePolicy>,
        ),
        row(
            "admin-api GET /api/v1/admin/machine-access/clients/{clientId}/effective",
            "/api/v1/admin/machine-access/clients/ci-1/effective",
            |c| drop(c.custd.get_effective_machine_access("ci-1")),
            round_trip::<MachineAccessEffective>,
        ),
    ]
}
