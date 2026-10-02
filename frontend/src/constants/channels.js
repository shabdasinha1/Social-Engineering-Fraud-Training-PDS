import { Camera, Mail, MessageCircle, MessageSquareText } from 'lucide-react'

/**
 * The four scenario categories, each holding SCENARIOS_PER_CHANNEL scenarios
 * in the backend pool. These are pools, not four separate assessments.
 * Accent classes are written out in full so Tailwind can detect them.
 */
export const CHANNELS = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    accent: 'text-channel-whatsapp bg-channel-whatsapp/10',
    description: 'Spot safe and fraud messages in WhatsApp chats.',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: Camera,
    accent: 'text-channel-instagram bg-channel-instagram/10',
    description: 'Spot safe and fraud messages on Instagram.',
  },
  {
    key: 'sms',
    label: 'SMS',
    icon: MessageSquareText,
    accent: 'text-channel-sms bg-channel-sms/10',
    description: 'Spot safe and fraud text messages.',
  },
  {
    key: 'email',
    label: 'Email',
    icon: Mail,
    accent: 'text-channel-email bg-channel-email/10',
    description: 'Spot safe and fraud emails.',
  },
]

export const CHANNEL_KEYS = CHANNELS.map((channel) => channel.key)
