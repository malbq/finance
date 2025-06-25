export interface Category {
  id: string
  description: string
  descriptionTranslated: string
  parentId?: string
  parentDescription?: string
  createdAt: Date
  updatedAt: Date
}
