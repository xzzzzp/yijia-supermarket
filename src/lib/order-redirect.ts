/**
 * 确认页查询串只带订单号。
 * 姓名、电话、地址、备注和订单正文由确认页按订单号在服务端读取。
 */
export function getRedirectUrl(orderId: string): string {
  const params = new URLSearchParams({ orderId });
  return `/order/success?${params.toString()}`;
}
