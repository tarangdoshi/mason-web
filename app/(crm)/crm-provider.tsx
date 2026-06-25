"use client";

import { App as AntApp, ConfigProvider } from "antd";

export default function CrmProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#84422c",
          colorInfo: "#84422c",
          colorSuccess: "#3f7d4f",
          colorWarning: "#a66f2c",
          colorError: "#ba1a1a",
          borderRadius: 20,
          borderRadiusLG: 24,
          colorBgLayout: "#fcf9f4",
          colorBgContainer: "#ffffff",
          colorBgElevated: "#ffffff",
          colorTextBase: "#1c1c19",
          colorTextSecondary: "#6f615b",
          colorBorder: "rgba(28, 28, 25, 0.08)",
          fontFamily: "var(--font-body)"
        },
        components: {
          Layout: {
            siderBg: "#f8f5f0",
            headerBg: "rgba(252,249,244,0.82)",
            bodyBg: "#fcf9f4"
          },
          Menu: {
            darkItemBg: "#f8f5f0",
            darkSubMenuItemBg: "#f8f5f0",
            itemBg: "#f8f5f0",
            itemSelectedBg: "rgba(132,66,44,0.08)",
            itemSelectedColor: "#84422c",
            itemColor: "#54433e",
            itemHoverColor: "#84422c",
            itemHoverBg: "rgba(132,66,44,0.05)",
            darkItemColor: "#54433e",
            darkItemSelectedColor: "#84422c",
            darkItemSelectedBg: "rgba(132,66,44,0.08)",
            darkItemHoverColor: "#84422c",
            darkItemHoverBg: "rgba(132,66,44,0.05)"
          },
          Card: {
            bodyPadding: 24,
            headerFontSize: 18,
            headerHeight: 56
          },
          Button: {
            controlHeight: 42,
            borderRadius: 18,
            fontWeight: 700
          },
          Input: {
            controlHeight: 44
          },
          Select: {
            controlHeight: 44
          },
          Drawer: {
            colorBgElevated: "#fffdf9"
          },
          Table: {
            headerBg: "#fcf9f4",
            rowHoverBg: "#faf5ef",
            borderColor: "rgba(28, 28, 25, 0.06)"
          }
        }
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
