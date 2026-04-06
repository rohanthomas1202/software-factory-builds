import { store } from './store'
import { hashPassword } from './auth'
import type { Priority } from './types'

export function seedDatabase(): void {
  // Clear existing data
  store.clear()

  // Create users
  const user1 = store.users.create({
    email: 'alice@example.com',
    name: 'Alice Johnson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    createdAt: Date.now()
  })

  const user2 = store.users.create({
    email: 'bob@example.com',
    name: 'Bob Smith',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    createdAt: Date.now()
  })

  // Create workspace
  const workspace = store.workspaces.create({
    name: 'Acme Inc.',
    ownerId: user1.id,
    createdAt: Date.now()
  })

  // Add members
  store.workspaceMembers.create({
    workspaceId: workspace.id,
    userId: user1.id,
    role: 'owner',
    joinedAt: Date.now()
  })

  store.workspaceMembers.create({
    workspaceId: workspace.id,
    userId: user2.id,
    role: 'member',
    joinedAt: Date.now()
  })

  // Create project
  const project = store.projects.create({
    workspaceId: workspace.id,
    name: 'Website Redesign',
    description: 'Complete overhaul of company website',
    createdAt: Date.now()
  })

  // Create board
  const board = store.boards.create({
    projectId: project.id,
    name: 'Development',
    createdAt: Date.now()
  })

  // Create columns with lexicographic positions
  const columns = [
    { name: 'Backlog', position: 'a' },
    { name: 'To Do', position: 'b' },
    { name: 'In Progress', position: 'c' },
    { name: 'Done', position: 'd' }
  ]

  const createdColumns = columns.map(col => 
    store.columns.create({
      boardId: board.id,
      name: col.name,
      position: col.position,
      createdAt: Date.now()
    })
  )

  // Create cards with fractional positions
  const priorities: Priority[] = ['low', 'medium', 'high', 'critical']
  const cardTitles = [
    'Design homepage layout',
    'Implement responsive navigation',
    'Fix mobile menu bug',
    'Add contact form validation',
    'Optimize image loading',
    'Write API documentation',
    'Update user dashboard',
    'Test checkout flow',
    'Integrate payment gateway',
    'Add dark mode toggle',
    'Fix broken links',
    'Update dependencies'
  ]

  const descriptions = [
    'Create wireframes and mockups for the new homepage design',
    'Ensure navigation works on all screen sizes',
    'Menu doesn\'t close properly on mobile devices',
    'Validate email, phone, and required fields',
    'Implement lazy loading for images',
    'Document all API endpoints with examples',
    'Improve UI/UX of the user dashboard',
    'Test the complete checkout process',
    'Connect Stripe payment system',
    'Add theme switching functionality',
    'Fix 404 errors on the sitemap',
    'Update npm packages to latest versions'
  ]

  createdColumns.forEach((column, columnIndex) => {
    // Create 3 cards per column
    for (let i = 0; i < 3; i++) {
      const cardIndex = columnIndex * 3 + i
      const assignee = cardIndex % 3 === 0 ? user1.id : cardIndex % 3 === 1 ? user2.id : null
      const dueDateOffset = (cardIndex + 1) * 24 * 60 * 60 * 1000 // days from now
      
      store.cards.create({
        columnId: column.id,
        title: cardTitles[cardIndex],
        description: descriptions[cardIndex],
        assigneeId: assignee,
        dueDate: Date.now() + dueDateOffset,
        priority: priorities[cardIndex % priorities.length],
        position: String.fromCharCode(97 + i), // a, b, c
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
    }
  })

  console.log('Database seeded with:')
  console.log(`- ${store.users.count()} users`)
  console.log(`- ${store.workspaces.count()} workspaces`)
  console.log(`- ${store.workspaceMembers.count()} workspace members`)
  console.log(`- ${store.projects.count()} projects`)
  console.log(`- ${store.boards.count()} boards`)
  console.log(`- ${store.columns.count()} columns`)
  console.log(`- ${store.cards.count()} cards`)
}