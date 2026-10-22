"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}

function clientReady(): boolean {
  return true;
}

function serverReady(): boolean {
  return false;
}

/** 服务端和注水首帧为 false，浏览器快照为 true。用来避免把还没读到的 localStorage 显示成空状态。 */
export function useClientReady(): boolean {
  return useSyncExternalStore(subscribe, clientReady, serverReady);
}
