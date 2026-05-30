import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const MOCK_CONFIGS: { keywords: string[]; config: object }[] = [
  {
    keywords: ['crm', 'lead', 'contact', 'deal', 'sales', 'customer'],
    config: {
      name: 'Sales CRM',
      description: 'Track leads, contacts and deals',
      collections: [
        {
          name: 'contacts',
          label: 'Contacts',
          fields: [
            { name: 'firstName', label: 'First Name', type: 'text', required: true },
            { name: 'lastName', label: 'Last Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'company', label: 'Company', type: 'text', required: false },
            { name: 'status', label: 'Status', type: 'select', required: true, options: ['lead', 'prospect', 'active', 'churned'] },
          ],
        },
        {
          name: 'deals',
          label: 'Deals',
          fields: [
            { name: 'title', label: 'Deal Title', type: 'text', required: true },
            { name: 'value', label: 'Value ($)', type: 'number', required: true },
            { name: 'stage', label: 'Stage', type: 'select', required: true, options: ['discovery', 'proposal', 'negotiation', 'closed-won', 'closed-lost'] },
            { name: 'closeDate', label: 'Expected Close', type: 'date', required: false },
            { name: 'notes', label: 'Notes', type: 'textarea', required: false },
          ],
        },
      ],
    },
  },
  {
    keywords: ['bug', 'issue', 'tracker', 'ticket', 'defect', 'dev', 'engineer'],
    config: {
      name: 'Bug Tracker',
      description: 'Track bugs and issues for your team',
      collections: [
        {
          name: 'bugs',
          label: 'Bugs',
          fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: true },
            { name: 'severity', label: 'Severity', type: 'select', required: true, options: ['low', 'medium', 'high', 'critical'] },
            { name: 'status', label: 'Status', type: 'select', required: true, options: ['open', 'in-progress', 'resolved', 'closed'] },
            { name: 'assignee', label: 'Assignee', type: 'text', required: false },
            { name: 'dueDate', label: 'Due Date', type: 'date', required: false },
          ],
        },
      ],
    },
  },
  {
    keywords: ['blog', 'post', 'article', 'content', 'cms', 'writer', 'publish'],
    config: {
      name: 'Content CMS',
      description: 'Manage blog posts and content',
      collections: [
        {
          name: 'posts',
          label: 'Posts',
          fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'slug', label: 'Slug', type: 'text', required: true },
            { name: 'content', label: 'Content', type: 'textarea', required: true },
            { name: 'category', label: 'Category', type: 'select', required: true, options: ['tech', 'design', 'business', 'other'] },
            { name: 'published', label: 'Published', type: 'boolean', required: false },
            { name: 'publishedAt', label: 'Publish Date', type: 'date', required: false },
          ],
        },
        {
          name: 'authors',
          label: 'Authors',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'bio', label: 'Bio', type: 'textarea', required: false },
          ],
        },
      ],
    },
  },
  {
    keywords: ['hr', 'employee', 'staff', 'hire', 'recruit', 'people', 'team'],
    config: {
      name: 'HR Manager',
      description: 'Manage employees and recruitment',
      collections: [
        {
          name: 'employees',
          label: 'Employees',
          fields: [
            { name: 'fullName', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'department', label: 'Department', type: 'select', required: true, options: ['engineering', 'design', 'marketing', 'sales', 'ops'] },
            { name: 'role', label: 'Role', type: 'text', required: true },
            { name: 'startDate', label: 'Start Date', type: 'date', required: true },
            { name: 'active', label: 'Active', type: 'boolean', required: false },
          ],
        },
      ],
    },
  },
  {
    keywords: ['event', 'conference', 'meetup', 'schedule', 'booking', 'rsvp'],
    config: {
      name: 'Event Manager',
      description: 'Manage events and attendees',
      collections: [
        {
          name: 'events',
          label: 'Events',
          fields: [
            { name: 'title', label: 'Event Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: false },
            { name: 'date', label: 'Date', type: 'date', required: true },
            { name: 'location', label: 'Location', type: 'text', required: true },
            { name: 'capacity', label: 'Capacity', type: 'number', required: true },
            { name: 'status', label: 'Status', type: 'select', required: true, options: ['draft', 'published', 'cancelled', 'completed'] },
          ],
        },
        {
          name: 'attendees',
          label: 'Attendees',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'confirmed', label: 'Confirmed', type: 'boolean', required: false },
          ],
        },
      ],
    },
  },
]

function matchConfig(prompt: string): object | null {
  const lower = prompt.toLowerCase()
  for (const mock of MOCK_CONFIGS) {
    if (mock.keywords.some(k => lower.includes(k))) {
      return mock.config
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt } = await req.json()
  if (!prompt?.trim())
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 })

  const mockConfig = matchConfig(prompt)
  if (mockConfig) {
    return NextResponse.json({ config: mockConfig, source: 'template' })
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate a JSON app config for: "${prompt}".
Return ONLY valid JSON. No markdown. No explanation.
Schema: { name, description, collections: [{ name, label, fields: [{ name (camelCase), label, type (text|email|number|boolean|date|select|textarea), required, options? }] }] }`
              }]
            }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
          })
        }
      )
      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const clean = text.replace(/```json|```/g, '').trim()
        const config = JSON.parse(clean)
        return NextResponse.json({ config, source: 'ai' })
      }
    } catch {
    
    }
  }

  return NextResponse.json({
    error: 'no_match',
    suggestions: ['CRM for contacts and deals', 'Bug tracker for dev team', 'Blog content manager', 'HR employee manager', 'Event and attendee tracker']
  }, { status: 422 })
}