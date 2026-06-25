"use client";

import { App } from "antd";
import styles from "./crm.module.css";

type ToastTone = "success" | "error" | "info";

function buildToastConfig(message: string, description?: string) {
  return {
    message,
    description,
    placement: "bottomRight" as const,
    className: styles.toastNotice
  };
}

export function useCrmToast() {
  const { notification } = App.useApp();

  function open(tone: ToastTone, message: string, description?: string) {
    notification[tone]({
      ...buildToastConfig(message, description),
      duration: tone === "error" ? 4.5 : 3.2
    });
  }

  return {
    success(message: string, description?: string) {
      open("success", message, description);
    },
    error(message: string, description?: string) {
      open("error", message, description);
    },
    info(message: string, description?: string) {
      open("info", message, description);
    }
  };
}
