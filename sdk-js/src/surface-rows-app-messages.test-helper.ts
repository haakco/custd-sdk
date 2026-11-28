import type { RowArea } from "./surface-conformance.test-helper.js";

const root = "/api/v1/app/messages";
const messageUuid = "0195f0a0-0000-4000-8000-000000000001";
const mediaUuid = "0195f0a0-0000-4000-8000-000000000002";
const image = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

export const appMessageRows: RowArea = {
  rows: [
    { id: `admin-api GET ${root}/session`, call: (c) => c.custd.appMessages.session() },
    {
      id: `admin-api POST ${root}/batch`,
      call: (c) => c.custd.appMessages.import({ source: "sms", messages: [] }),
    },
    {
      id: `admin-api POST ${root}/search`,
      call: (c) => c.custd.appMessages.search({ query: "test" }),
    },
    {
      id: `admin-api GET ${root}/{messageUuid}`,
      params: { messageUuid },
      call: (c) => c.custd.appMessages.get(messageUuid),
    },
    {
      id: `admin-api DELETE ${root}/sources/{source}`,
      params: { source: "sms" },
      call: (c) => c.custd.appMessages.deleteSource("sms"),
    },
    {
      id: `admin-api PUT ${root}/{messageUuid}/media`,
      params: { messageUuid },
      call: (c) => c.custd.appMessages.uploadMedia({ messageUuid, image }),
    },
    {
      id: `admin-api GET ${root}/{messageUuid}/media/{mediaUuid}`,
      params: { messageUuid, mediaUuid },
      call: (c) => c.custd.appMessages.downloadMedia({ messageUuid, mediaUuid }),
      response: () => new Response(image, { headers: { "content-type": "image/jpeg" } }),
    },
    { id: `admin-api GET ${root}/connector`, call: (c) => c.custd.appMessages.getConnector() },
    {
      id: `admin-api POST ${root}/connector/control`,
      call: (c) => c.custd.appMessages.controlConnector({ action: "pause" }),
    },
    { id: `admin-api POST ${root}/connector/enroll`, call: (c) => c.custd.appMessages.enrollConnector() },
    {
      id: `admin-api POST ${root}/connector/report`,
      call: (c) => c.custd.appMessages.reportConnector({ connectionState: "syncing", pendingMedia: 0 }),
    },
    { id: `admin-api GET ${root}/connector/session`, call: (c) => c.custd.appMessages.connectorSession() },
    {
      id: `admin-api POST ${root}/mutations`,
      call: (c) => c.custd.appMessages.mutate({ source: "whatsapp", sourceGeneration: 2, mutations: [] }),
    },
  ],
  decoded: [
    `admin-api GET ${root}/connector`,
    `admin-api POST ${root}/connector/control`,
    `admin-api POST ${root}/connector/enroll`,
    `admin-api POST ${root}/connector/report`,
    `admin-api GET ${root}/connector/session`,
    `admin-api POST ${root}/mutations`,
    `admin-api GET ${root}/session`,
    `admin-api POST ${root}/batch`,
    `admin-api POST ${root}/search`,
    `admin-api GET ${root}/{messageUuid}`,
    `admin-api DELETE ${root}/sources/{source}`,
    `admin-api PUT ${root}/{messageUuid}/media`,
  ],
};
