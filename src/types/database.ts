export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          middle_name: string | null;
          date_of_birth: string | null;
          gender: string | null;
          nationality: string | null;
          primary_phone: string | null;
          secondary_phone: string | null;
          whatsapp_number: string | null;
          emergency_contact: string | null;
          primary_address: Json | null;
          mailing_address: Json | null;
          language: string | null;
          timezone: string | null;
          currency: string | null;
          date_format: string | null;
          number_format: string | null;
          week_start: string | null;
          risk_tolerance: string | null;
          investment_experience: string | null;
          investment_horizon: string | null;
          annual_income: string | null;
          net_worth: string | null;
          employment_status: string | null;
          profile_completion: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          middle_name?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          nationality?: string | null;
          primary_phone?: string | null;
          secondary_phone?: string | null;
          whatsapp_number?: string | null;
          emergency_contact?: string | null;
          primary_address?: Json | null;
          mailing_address?: Json | null;
          language?: string | null;
          timezone?: string | null;
          currency?: string | null;
          date_format?: string | null;
          number_format?: string | null;
          week_start?: string | null;
          risk_tolerance?: string | null;
          investment_experience?: string | null;
          investment_horizon?: string | null;
          annual_income?: string | null;
          net_worth?: string | null;
          employment_status?: string | null;
          profile_completion?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          middle_name?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          nationality?: string | null;
          primary_phone?: string | null;
          secondary_phone?: string | null;
          whatsapp_number?: string | null;
          emergency_contact?: string | null;
          primary_address?: Json | null;
          mailing_address?: Json | null;
          language?: string | null;
          timezone?: string | null;
          currency?: string | null;
          date_format?: string | null;
          number_format?: string | null;
          week_start?: string | null;
          risk_tolerance?: string | null;
          investment_experience?: string | null;
          investment_horizon?: string | null;
          annual_income?: string | null;
          net_worth?: string | null;
          employment_status?: string | null;
          profile_completion?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          name: string;
          shares: number;
          average_price: number;
          current_price: number;
          sector: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          name: string;
          shares: number;
          average_price: number;
          current_price: number;
          sector: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          name?: string;
          shares?: number;
          average_price?: number;
          current_price?: number;
          sector?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          name: string;
          type: 'buy' | 'sell';
          order_type: 'market' | 'limit' | 'stop';
          quantity: number;
          price: number;
          total: number;
          status: 'executed' | 'pending' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          name: string;
          type: 'buy' | 'sell';
          order_type: 'market' | 'limit' | 'stop';
          quantity: number;
          price: number;
          total: number;
          status?: 'executed' | 'pending' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          name?: string;
          type?: 'buy' | 'sell';
          order_type?: 'market' | 'limit' | 'stop';
          quantity?: number;
          price?: number;
          total?: number;
          status?: 'executed' | 'pending' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          name?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];