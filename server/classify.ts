import { choice, noul, score, TypeSafeClient } from '@typesafe-ai/sdk'

export type Category = 'work' | 'private' | 'shopping' | 'other'
export type Priority = 'low' | 'medium' | 'high'

export type Classification = {
  category: Category
  priority: Priority
  urgent: boolean
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

// noul(はいの確率)がこの値以上なら「急ぎ」とみなす
const URGENT_THRESHOLD = 0.7

let client: TypeSafeClient | undefined

export const isJevEnabled = () => Boolean(process.env.TYPESAFE_API_KEY?.trim())

export async function classifyTodo(text: string): Promise<Classification> {
  client ??= new TypeSafeClient()

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })

  // 3つの質問を1回のリクエストでまとめて Jev に聞く
  const { answers } = await client.systemOne({
    state: { todo: text, today },
    questions: {
      category: choice('Which category does the TODO item in `todo` belong to?', {
        work: 'Work, school, or study tasks',
        private: 'Personal life: hobbies, family, friends, health, housework',
        shopping: 'Buying, ordering, or picking up something',
        other: 'None of the above',
      }),
      priority: score('How important is the TODO item in `todo`?', [
        'Low: nice to have, little consequence if it is delayed or skipped',
        'Medium: should be done, some consequence if it is delayed',
        'High: important, serious consequence if it is not done',
      ]),
      urgent: noul(
        'Is the TODO item in `todo` time-sensitive, with a deadline of `today` or within the next day or two?',
      ),
    },
  })

  return {
    category: answers.category.choice,
    priority: PRIORITIES[Math.round(answers.priority.score)] ?? 'medium',
    urgent: answers.urgent.noul >= URGENT_THRESHOLD,
  }
}
