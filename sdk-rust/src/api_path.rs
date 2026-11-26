//! Paths for the Admin and Analytics API routes: the base, query parameters in a fixed order,
//! then the optional `?companySlug=` a system administrator uses to name the tenant.

use crate::transport::percent_encode;

pub(crate) const SITE_DOMAINS: &str = "/api/v1/site-domains";

pub(crate) const NO_BODY: Option<&()> = None;

/// `path` with each set, non-empty query value in the given order, then `companySlug`.
pub(crate) fn api_path(
    path: String,
    query: &[(&str, Option<String>)],
    company_slug: Option<&str>,
) -> String {
    let slug = company_slug.map(|slug| ("companySlug", slug));
    let pairs: Vec<String> = query
        .iter()
        .filter_map(|(name, value)| value.as_deref().map(|value| (*name, value)))
        .chain(slug)
        .filter(|(_, value)| !value.is_empty())
        .map(|(name, value)| format!("{name}={}", percent_encode(value)))
        .collect();
    if pairs.is_empty() {
        path
    } else {
        format!("{path}?{}", pairs.join("&"))
    }
}
