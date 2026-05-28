export const TEMPLATES = [
  {
    name: 'CRM',
    description: 'Track contacts and deals',
    config: {
      name: 'Simple CRM',
      description: 'Manage contacts and track deals',
      collections: [
        {
          name: 'contacts',
          label: 'Contacts',
          fields: [
            { name: 'firstName', label: 'First Name', type: 'text', required: true },
            { name: 'lastName', label: 'Last Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'company', label: 'Company', type: 'text', required: false },
            { name: 'status', label: 'Status', type: 'select', required: true, options: ['lead', 'active', 'churned'] },
          ],
        },
        {
          name: 'deals',
          label: 'Deals',
          fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'value', label: 'Value ($)', type: 'number', required: true },
            { name: 'stage', label: 'Stage', type: 'select', required: true, options: ['discovery', 'proposal', 'negotiation', 'closed'] },
            { name: 'notes', label: 'Notes', type: 'textarea', required: false },
          ],
        },
      ],
    },
  },
  {
    name: 'Task Tracker',
    description: 'Projects and tasks',
    config: {
      name: 'Task Tracker',
      description: 'Manage projects and tasks',
      collections: [
        {
          name: 'tasks',
          label: 'Tasks',
          fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: false },
            { name: 'priority', label: 'Priority', type: 'select', required: true, options: ['low', 'medium', 'high'] },
            { name: 'status', label: 'Status', type: 'select', required: true, options: ['todo', 'in-progress', 'done'] },
            { name: 'dueDate', label: 'Due Date', type: 'date', required: false },
          ],
        },
      ],
    },
  },
  {
    name: 'Inventory',
    description: 'Products and stock',
    config: {
      name: 'Inventory',
      description: 'Track products and stock levels',
      collections: [
        {
          name: 'products',
          label: 'Products',
          fields: [
            { name: 'name', label: 'Product Name', type: 'text', required: true },
            { name: 'sku', label: 'SKU', type: 'text', required: true },
            { name: 'price', label: 'Price ($)', type: 'number', required: true },
            { name: 'stock', label: 'Stock', type: 'number', required: true },
            { name: 'category', label: 'Category', type: 'select', required: false, options: ['electronics', 'clothing', 'food', 'other'] },
          ],
        },
      ],
    },
  },
]