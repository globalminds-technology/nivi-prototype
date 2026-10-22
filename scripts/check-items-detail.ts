import { ZohoHttpClient } from "../infrastructure/zoho/zoho-http";
import { ZohoTokenProvider } from "../infrastructure/zoho/zoho-token-provider";
import { env } from "../infrastructure/config/env";

async function run() {
  const tokenProvider = new ZohoTokenProvider();
  const http = new ZohoHttpClient(tokenProvider);

  try {
    const res = await http.get<{ items: any[] }>("items", { search_text: "LS-001" });
    const lsItem = res.items?.find((i: any) => i.sku === "LS-001");
    if (lsItem) {
      console.log("=== LS-001 DETAIL ===");
      const detail = await http.get<any>(`items/${lsItem.item_id}`);
      console.log(JSON.stringify({
        item_id: detail.item?.item_id,
        name: detail.item?.name,
        sku: detail.item?.sku,
        product_type: detail.item?.product_type,
        item_type: detail.item?.item_type,
        rate: detail.item?.rate,
        purchase_rate: detail.item?.purchase_rate,
        account_id: detail.item?.account_id,
        account_name: detail.item?.account_name,
        purchase_account_id: detail.item?.purchase_account_id,
        purchase_account_name: detail.item?.purchase_account_name,
        inventory_account_id: detail.item?.inventory_account_id,
        track_inventory: detail.item?.track_inventory,
        created_time: detail.item?.created_time,
        last_modified_time: detail.item?.last_modified_time,
      }, null, 2));
    } else {
      console.log("LS-001 not found");
    }

    const res2 = await http.get<{ items: any[] }>("items", { search_text: "CS-001" });
    const csItem = res2.items?.find((i: any) => i.sku === "CS-001");
    if (csItem) {
      console.log("=== CS-001 DETAIL ===");
      const detail2 = await http.get<any>(`items/${csItem.item_id}`);
      console.log(JSON.stringify({
        item_id: detail2.item?.item_id,
        name: detail2.item?.name,
        sku: detail2.item?.sku,
        product_type: detail2.item?.product_type,
        item_type: detail2.item?.item_type,
        rate: detail2.item?.rate,
        purchase_rate: detail2.item?.purchase_rate,
        account_id: detail2.item?.account_id,
        account_name: detail2.item?.account_name,
        purchase_account_id: detail2.item?.purchase_account_id,
        purchase_account_name: detail2.item?.purchase_account_name,
        inventory_account_id: detail2.item?.inventory_account_id,
        track_inventory: detail2.item?.track_inventory,
        created_time: detail2.item?.created_time,
        last_modified_time: detail2.item?.last_modified_time,
      }, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
