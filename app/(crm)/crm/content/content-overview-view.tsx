"use client";

import {
  AppstoreOutlined,
  FileImageOutlined,
  FileTextOutlined,
  LayoutOutlined,
  MedicineBoxOutlined,
  MessageOutlined
} from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Tag, Typography } from "antd";
import Link from "next/link";
import type { ContentModuleKey } from "./content-studio";
import styles from "../crm.module.css";

const { Paragraph, Text, Title } = Typography;

const moduleIcons: Record<ContentModuleKey, React.ReactNode> = {
  packages: <AppstoreOutlined />,
  testimonials: <MessageOutlined />,
  doctors: <MedicineBoxOutlined />,
  gallery: <FileImageOutlined />,
  homepage: <LayoutOutlined />,
  media: <FileTextOutlined />
};

export default function ContentOverviewView({
  modules
}: {
  modules: Array<{
    key: ContentModuleKey;
    title: string;
    description: string;
    route: string;
    totalCount: number;
    publishedCount: number;
  }>;
}) {
  const totalItems = modules.reduce((sum, module) => sum + module.totalCount, 0);
  const totalPublished = modules.reduce((sum, module) => sum + module.publishedCount, 0);

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card bordered={false} className={styles.heroCard}>
        <div className={styles.heroGrid}>
          <Space direction="vertical" size={16}>
            <Tag className={styles.eyebrowTag}>Content studio</Tag>
            <Title className={styles.heroHeadline}>Edit the public story without leaving the operational workspace.</Title>
            <Paragraph className={styles.heroDescription}>
              Packages, proof, homepage messaging, and media now sit inside the same launch panel as the CRM so the
              team can move quickly without losing design or content quality.
            </Paragraph>
          </Space>

          <div className={styles.heroMiniGrid}>
            <div className={styles.miniPanel}>
              <span className={styles.miniLabel}>Modules</span>
              <span className={styles.miniValue}>{modules.length}</span>
              <span className={styles.miniText}>Structured editing surfaces in this control panel.</span>
            </div>
            <div className={styles.miniPanel}>
              <span className={styles.miniLabel}>Published</span>
              <span className={styles.miniValue}>{totalPublished}</span>
              <span className={styles.miniText}>{totalItems} total records currently loaded for editing.</span>
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col key={module.key} xs={24} md={12} xl={8}>
            <Card bordered={false} className={styles.surfaceCard}>
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                <div className={styles.kpiIcon}>{moduleIcons[module.key]}</div>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {module.title}
                  </Title>
                  <Paragraph className={styles.mutedText} style={{ margin: "0.5rem 0 0" }}>
                    {module.description}
                  </Paragraph>
                </div>
                <Space wrap>
                  <Tag className={styles.pill}>{module.totalCount} items</Tag>
                  <Tag color="green" className={styles.pill}>
                    {module.publishedCount} published
                  </Tag>
                </Space>
                <Text className={styles.mutedText}>Edit in detail, save changes, then publish when the module is ready.</Text>
                <Link href={module.route}>
                  <Button type="primary">Open studio</Button>
                </Link>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
