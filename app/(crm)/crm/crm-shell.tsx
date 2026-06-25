"use client";

import {
  AppstoreOutlined,
  BellOutlined,
  DashboardOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  MessageOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Badge, Button, Input, Layout, Menu, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { logoutAction } from "./actions";
import type { StaffUser } from "../../../lib/crm";
import styles from "./crm.module.css";

const { Header, Sider, Content } = Layout;
const { Paragraph, Text } = Typography;

function getSelectedKey(pathname: string) {
  if (pathname === "/crm" || pathname.startsWith("/crm/leads/")) {
    return "dashboard";
  }
  if (pathname === "/crm/content") {
    return "content-overview";
  }
  if (pathname.startsWith("/crm/content/packages")) {
    return "content-packages";
  }
  if (pathname.startsWith("/crm/content/testimonials")) {
    return "content-testimonials";
  }
  if (pathname.startsWith("/crm/content/doctors")) {
    return "content-doctors";
  }
  if (pathname.startsWith("/crm/content/gallery")) {
    return "content-gallery";
  }
  if (pathname.startsWith("/crm/content/homepage")) {
    return "content-homepage";
  }
  if (pathname.startsWith("/crm/content/media")) {
    return "content-media";
  }
  return "dashboard";
}

export default function CrmShell({
  user,
  title,
  subtitle,
  children
}: {
  user: StaffUser;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedKey = getSelectedKey(pathname);
  const headerSearch = searchParams.get("search") ?? "";

  const menuItems = [
    {
      key: "operations-root",
      icon: <DashboardOutlined />,
      label: "Operations",
      children: [
        {
          key: "dashboard",
          label: <Link href="/crm">Dashboard</Link>
        }
      ]
    },
    {
      key: "content-root",
      icon: <FolderOpenOutlined />,
      label: "Content studio",
      children: [
        {
          key: "content-overview",
          icon: <AppstoreOutlined />,
          label: <Link href="/crm/content">Overview</Link>
        },
        {
          key: "content-packages",
          icon: <AppstoreOutlined />,
          label: <Link href="/crm/content/packages">Packages</Link>
        },
        {
          key: "content-testimonials",
          icon: <MessageOutlined />,
          label: <Link href="/crm/content/testimonials">Testimonials</Link>
        },
        {
          key: "content-doctors",
          icon: <MedicineBoxOutlined />,
          label: <Link href="/crm/content/doctors">Doctors</Link>
        },
        {
          key: "content-gallery",
          icon: <FileImageOutlined />,
          label: <Link href="/crm/content/gallery">Gallery</Link>
        },
        {
          key: "content-homepage",
          icon: <FileTextOutlined />,
          label: <Link href="/crm/content/homepage">Homepage</Link>
        },
        {
          key: "content-media",
          icon: <FileImageOutlined />,
          label: <Link href="/crm/content/media">Media</Link>
        }
      ]
    }
  ];

  return (
    <Layout className={styles.appShell}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={272}
        className={styles.shellSider}
      >
        <div className={styles.siderInner}>
          <div className={styles.brandBlock}>
            <h1 className={styles.brandName}>Mason Company</h1>
            <p className={styles.brandMeta}>Mumbai & Goa Launch</p>
          </div>

          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={["operations-root", "content-root"]}
            items={menuItems}
            className={styles.shellMenu}
          />

          <Link href="/crm?compose=new-lead">
            <Button type="primary" icon={<PlusOutlined />} className={styles.newLeadButton} block>
              New Lead
            </Button>
          </Link>

          <div className={styles.utilityLinks}>
            <button type="button" className={styles.utilityLink}>
              <QuestionCircleOutlined />
              <span>Help</span>
            </button>
            <button type="button" className={styles.utilityLink}>
              <SettingOutlined />
              <span>Settings</span>
            </button>
          </div>

          <div className={styles.profileCard}>
            <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
              <Space align="start">
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#84422c" }} />
                <div>
                  <Text strong>{user.fullName}</Text>
                  <br />
                  <Text className={styles.mutedText}>{user.email}</Text>
                </div>
              </Space>
              <Tag className={styles.pill} color={user.role === "ADMIN" ? "gold" : "geekblue"}>
                {user.role}
              </Tag>
            </Space>

            <form action={logoutAction} style={{ marginTop: 16 }}>
              <Button icon={<LogoutOutlined />} htmlType="submit" block>
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </Sider>

      <Layout>
        <Header className={styles.topHeader}>
          <div className={styles.topHeaderLeft}>
            <form
              className={styles.searchForm}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const value = String(formData.get("search") ?? "").trim();
                const params = new URLSearchParams(searchParams.toString());
                if (value) {
                  params.set("search", value);
                } else {
                  params.delete("search");
                }
                if (pathname !== "/crm") {
                  router.push(`/crm${params.toString() ? `?${params.toString()}` : ""}`);
                } else {
                  router.push(params.toString() ? `/crm?${params.toString()}` : "/crm");
                }
              }}
            >
              <Input
                name="search"
                defaultValue={headerSearch}
                prefix={<SearchOutlined />}
                placeholder="Search leads, packages, or team activity..."
                className={styles.headerSearch}
              />
            </form>
          </div>

          <Space size={18}>
            <Badge dot color="#84422c">
              <Button icon={<BellOutlined />} className={styles.notificationButton} />
            </Badge>

            <div className={styles.userIdentity}>
              <div className={styles.userMeta}>
                <Text strong>{user.fullName}</Text>
                <Text className={styles.mutedText}>{user.role}</Text>
              </div>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#d9c1bb", color: "#84422c" }} />
            </div>
          </Space>
        </Header>

        <Content className={styles.contentArea}>
          <div className={styles.pageHero}>
            <p className={styles.pageEyebrow}>Regional overview</p>
            <h2 className={styles.pageTitle}>{title}</h2>
            <p className={styles.pageSubtitle}>{subtitle}</p>
          </div>

          {children}
        </Content>

        <div className={styles.pageFooter}>
          <div>v1.2.0 Mason Company control panel</div>
          <div className={styles.pageFooterLinks}>
            <Link href="/crm" className={styles.footerLink}>
              Dashboard
            </Link>
            <Link href="/crm/content" className={styles.footerLink}>
              Content studio
            </Link>
            <span>Contact support</span>
          </div>
        </div>
      </Layout>
    </Layout>
  );
}
