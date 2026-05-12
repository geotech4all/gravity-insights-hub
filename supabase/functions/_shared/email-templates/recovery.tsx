/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for GraviMag Cloud</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={brand}>GraviMag Cloud</Text></Section>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Click below to choose a new one.
        </Text>
        <Button style={button} href={confirmationUrl}>Reset Password</Button>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this email — your password won't change.
        </Text>
        <Hr style={hr} />
        <Text style={signature}>© {new Date().getFullYear()} GraviMag Cloud · by Geotech4All</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const header = { borderBottom: '3px solid #DC2433', paddingBottom: '10px', marginBottom: '24px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: '#DC2433', margin: 0 }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: '#DC2433', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#888', margin: '28px 0 0', lineHeight: '1.5' }
const hr = { borderColor: '#eee', margin: '28px 0 16px' }
const signature = { fontSize: '11px', color: '#aaa', margin: 0, textAlign: 'center' as const }
