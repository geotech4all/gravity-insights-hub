/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for GraviMag Cloud</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={brand}>GraviMag Cloud</Text></Section>
        <Heading style={h1}>Welcome aboard — confirm your email</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>. Please confirm{' '}
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link> to activate your account.
        </Text>
        <Button style={button} href={confirmationUrl}>Verify Email</Button>
        <Text style={footer}>If you didn't create an account, you can safely ignore this email.</Text>
        <Hr style={hr} />
        <Text style={signature}>© {new Date().getFullYear()} GraviMag Cloud · by Geotech4All</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const header = { borderBottom: '3px solid #DC2433', paddingBottom: '10px', marginBottom: '24px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: '#DC2433', margin: 0, letterSpacing: '-0.01em' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#DC2433', textDecoration: 'underline' }
const button = { backgroundColor: '#DC2433', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#888', margin: '28px 0 0', lineHeight: '1.5' }
const hr = { borderColor: '#eee', margin: '28px 0 16px' }
const signature = { fontSize: '11px', color: '#aaa', margin: 0, textAlign: 'center' as const }
