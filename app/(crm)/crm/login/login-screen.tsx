"use client";

import { BarChartOutlined, EnvironmentOutlined, PictureOutlined, TeamOutlined } from "@ant-design/icons";
import { Card, Col, Row, Space, Tag, Typography } from "antd";
import LoginForm from "./login-form";
import styles from "../crm.module.css";

const { Paragraph, Text, Title } = Typography;

const metrics = [
  {
    icon: <TeamOutlined />,
    title: "Lead operations",
    body: "Calls, booking requests, support, and WhatsApp enquiries tracked in one control panel."
  },
  {
    icon: <PictureOutlined />,
    title: "Content control",
    body: "Homepage sections, testimonials, gallery, and packages stay inside the same workspace."
  },
  {
    icon: <BarChartOutlined />,
    title: "Launch reporting",
    body: "Pipeline health, agent coverage, and activity are visible the moment the team signs in."
  },
  {
    icon: <EnvironmentOutlined />,
    title: "Mumbai and Goa",
    body: "Built for the launch footprint with a regional operational view instead of a generic admin."
  }
];

export default function LoginScreen() {
  return (
    <main className={styles.loginShell}>
      <Row gutter={[24, 24]} align="middle" className={styles.loginGrid}>
        <Col xs={24} xl={15}>
          <Card bordered={false} className={styles.loginHero}>
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              <Space wrap>
                <Tag className={styles.eyebrowTag}>Internal launch console</Tag>
                <Tag className={styles.pill}>Unified CRM + content studio</Tag>
              </Space>

              <div>
                <Title className={styles.heroHeadline}>Mason Company Control Panel</Title>
                <Paragraph className={styles.heroDescription}>
                  Run regional operations, manage launch content, and keep every customer conversation moving from one
                  premium workspace designed for the Mumbai and Goa rollout.
                </Paragraph>
              </div>

              <div className={styles.loginMetrics}>
                {metrics.map((item) => (
                  <div key={item.title} className={styles.loginMetric}>
                    <Space direction="vertical" size={8}>
                      <div className={styles.kpiIcon}>{item.icon}</div>
                      <Text strong>{item.title}</Text>
                      <Text className={styles.mutedText}>{item.body}</Text>
                    </Space>
                  </div>
                ))}
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card bordered={false} className={styles.loginFormCard}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <div>
                <Text className={styles.pageEyebrow}>Staff access</Text>
                <Title level={2} style={{ margin: "0.35rem 0 0" }}>
                  Sign in to Mason CRM
                </Title>
                <Paragraph className={styles.pageSubtitle} style={{ marginTop: 10 }}>
                  Use your admin or agent account to access the operational queue and content studio.
                </Paragraph>
              </div>

              <LoginForm />

              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Text strong>Demo accounts</Text>
                <Text className={styles.mutedText}>admin@masoncompany.in / AegisAdmin123!</Text>
                <Text className={styles.mutedText}>asha@masoncompany.in / AegisAgent123!</Text>
                <Text className={styles.mutedText}>rohan@masoncompany.in / AegisAgent123!</Text>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </main>
  );
}
