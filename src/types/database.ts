export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budget_categories: {
        Row: {
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          actual_amount: number | null
          approved_amount: number | null
          category_id: string | null
          created_at: string | null
          description: string
          estimated_amount: number | null
          event_id: string | null
          id: string
          notes: string | null
          quoted_amount: number | null
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          actual_amount?: number | null
          approved_amount?: number | null
          category_id?: string | null
          created_at?: string | null
          description: string
          estimated_amount?: number | null
          event_id?: string | null
          id?: string
          notes?: string | null
          quoted_amount?: number | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          actual_amount?: number | null
          approved_amount?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string
          estimated_amount?: number | null
          event_id?: string | null
          id?: string
          notes?: string | null
          quoted_amount?: number | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          state: string | null
          tags: string[] | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contractors: {
        Row: {
          city: string | null
          created_at: string | null
          day_rate: number | null
          email: string | null
          first_name: string
          hourly_rate: number | null
          id: string
          insurance_on_file: boolean | null
          last_name: string
          nda_signed: boolean | null
          notes: string | null
          phone: string | null
          rating: number | null
          role: string | null
          specialties: string[] | null
          state: string | null
          updated_at: string | null
          w9_on_file: boolean | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          day_rate?: number | null
          email?: string | null
          first_name: string
          hourly_rate?: number | null
          id?: string
          insurance_on_file?: boolean | null
          last_name: string
          nda_signed?: boolean | null
          notes?: string | null
          phone?: string | null
          rating?: number | null
          role?: string | null
          specialties?: string[] | null
          state?: string | null
          updated_at?: string | null
          w9_on_file?: boolean | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          day_rate?: number | null
          email?: string | null
          first_name?: string
          hourly_rate?: number | null
          id?: string
          insurance_on_file?: boolean | null
          last_name?: string
          nda_signed?: boolean | null
          notes?: string | null
          phone?: string | null
          rating?: number | null
          role?: string | null
          specialties?: string[] | null
          state?: string | null
          updated_at?: string | null
          w9_on_file?: boolean | null
        }
        Relationships: []
      }
      event_contractors: {
        Row: {
          contractor_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          rate_amount: number | null
          rate_type: string | null
          role: string | null
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          rate_amount?: number | null
          rate_type?: string | null
          role?: string | null
        }
        Update: {
          contractor_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          rate_amount?: number | null
          rate_type?: string | null
          role?: string | null
        }
        Relationships: []
      }
      event_files: {
        Row: {
          category: string | null
          created_at: string | null
          event_id: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          event_id?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          event_id?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          id: string
          location_address: string | null
          location_city: string | null
          location_name: string | null
          location_state: string | null
          name: string
          notes: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          location_address?: string | null
          location_city?: string | null
          location_name?: string | null
          location_state?: string | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          location_address?: string | null
          location_city?: string | null
          location_name?: string | null
          location_state?: string | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          attendee_emails: string[] | null
          created_at: string | null
          description: string | null
          end_time: string
          event_id: string | null
          id: string
          location: string | null
          m365_event_id: string | null
          meeting_type: string | null
          notes: string | null
          start_time: string
          teams_link: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attendee_emails?: string[] | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_id?: string | null
          id?: string
          location?: string | null
          m365_event_id?: string | null
          meeting_type?: string | null
          notes?: string | null
          start_time: string
          teams_link?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attendee_emails?: string[] | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_id?: string | null
          id?: string
          location?: string | null
          m365_event_id?: string | null
          meeting_type?: string | null
          notes?: string | null
          start_time?: string
          teams_link?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          contractor_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          event_id: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          contractor_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          contractor_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Client = Tables<'clients'>
export type Contact = Tables<'contacts'>
export type Contractor = Tables<'contractors'>
export type Event = Tables<'events'>
export type Task = Tables<'tasks'>
export type BudgetCategory = Tables<'budget_categories'>
export type BudgetItem = Tables<'budget_items'>
export type Meeting = Tables<'meetings'>
export type EventFile = Tables<'event_files'>
export type EventContractor = Tables<'event_contractors'>
