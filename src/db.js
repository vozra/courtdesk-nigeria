import { supabase } from "./supabase";

// ─── MATTERS ─────────────────────────────────────────────────────────────────
export const db = {
  matters: {
    async getAll() {
      const { data, error } = await supabase
        .from("matters")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async add(matter) {
      const { data, error } = await supabase
        .from("matters")
        .insert([{
          id: matter.id,
          title: matter.title,
          client: matter.client,
          lawyer: matter.lawyer,
          type: matter.type,
          court: matter.court,
          status: matter.status,
          priority: matter.priority,
          filed: matter.filed,
          next_date: matter.nextDate,
          suit_no: matter.suitNo,
          judge: matter.judge,
          value_ngn: matter.valueNGN,
          adjournments: matter.adjournments,
          stage: matter.stage,
          timeline: matter.timeline,
        }])
        .select();
      if (error) throw error;
      return data[0];
    },
    async update(id, updates) {
      const { error } = await supabase
        .from("matters")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
  },

  // ─── CLIENTS ───────────────────────────────────────────────────────────────
  clients: {
    async getAll() {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async add(client) {
      const { data, error } = await supabase
        .from("clients")
        .insert([client])
        .select();
      if (error) throw error;
      return data[0];
    },
  },

  // ─── RUNNER TASKS ──────────────────────────────────────────────────────────
  tasks: {
    async getAll() {
      const { data, error } = await supabase
        .from("runner_tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async add(task) {
      const { data, error } = await supabase
        .from("runner_tasks")
        .insert([{
          matter_ref: task.matterRef,
          court: task.court,
          instruction: task.instruction,
          assigned_to: task.assignedTo,
          assigned_by: task.assignedBy,
          date: task.date,
          status: task.status,
          approved: task.approved,
          updates: task.updates,
        }])
        .select();
      if (error) throw error;
      return data[0];
    },
    async update(id, updates) {
      const { error } = await supabase
        .from("runner_tasks")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
  },

  // ─── INVOICES ──────────────────────────────────────────────────────────────
  invoices: {
    async getAll() {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async add(invoice) {
      const { data, error } = await supabase
        .from("invoices")
        .insert([invoice])
        .select();
      if (error) throw error;
      return data[0];
    },
  },

  // ─── PROOFS ────────────────────────────────────────────────────────────────
  proofs: {
    async getAll() {
      const { data, error } = await supabase
        .from("proofs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async add(proof) {
      const { data, error } = await supabase
        .from("proofs")
        .insert([proof])
        .select();
      if (error) throw error;
      return data[0];
    },
  },

  // ─── LAWYERS ───────────────────────────────────────────────────────────────
  lawyers: {
    async getAll() {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async add(lawyer) {
      const { data, error } = await supabase
        .from("lawyers")
        .insert([{
          name: lawyer.name,
          title: lawyer.title,
          specialization: lawyer.specialization,
          email: lawyer.email,
          phone: lawyer.phone,
          bar: lawyer.bar,
          years_exp: lawyer.yearsExp,
          status: lawyer.status,
          rating: lawyer.rating,
          cases: lawyer.cases,
        }])
        .select();
      if (error) throw error;
      return data[0];
    },
  },

  // ─── AUDIT LOG ─────────────────────────────────────────────────────────────
  audit: {
    async log(action, details, user) {
      await supabase.from("audit_log").insert([{
        action,
        details,
        performed_by: user?.email || "unknown",
        performed_at: new Date().toISOString(),
      }]);
    },
  },
};