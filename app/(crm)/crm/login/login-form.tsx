"use client";

import { Alert, Button, Form, Input, Space } from "antd";
import { LockOutlined, LoginOutlined, MailOutlined } from "@ant-design/icons";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginActionState } from "../actions";

const initialState: LoginActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="primary" htmlType="submit" icon={<LoginOutlined />} loading={pending} size="large" block>
      {pending ? "Opening CRM" : "Open CRM"}
    </Button>
  );
}

export default function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <Form component={false} layout="vertical">
      <form action={action}>
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <Form.Item label="Email" required style={{ marginBottom: 0 }}>
            <Input
              name="email"
              type="email"
              size="large"
              prefix={<MailOutlined />}
              placeholder="admin@masoncompany.in"
              autoComplete="email"
              required
            />
          </Form.Item>

          <Form.Item label="Password" required style={{ marginBottom: 0 }}>
            <Input.Password
              name="password"
              size="large"
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </Form.Item>

          {state.error ? <Alert type="error" showIcon message={state.error} /> : null}

          <SubmitButton />
        </Space>
      </form>
    </Form>
  );
}
