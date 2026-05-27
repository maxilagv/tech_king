import React, { useMemo, useState, useEffect } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  Eye,
  FileText,
  Heading2,
  Image as ImageIcon,
  LayoutList,
  List,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { db } from "@/api/firebase";
import { useBlogs } from "@/hooks/useBlogs";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { slugify } from "@/utils";
import { BRAND_NAME } from "@/constants/brand";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  coverImage: "",
  author: BRAND_NAME,
  published: false,
  tags: "",
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  keywords: "",
  contentBlocks: [
    { type: "paragraph", text: "" }
  ],
};

function getBlogWriteErrorMessage(error) {
  if (error?.code === "permission-denied") {
    return "Firebase rechazó la operación por permisos insuficientes. Revisa que la sesión siga activa y que tengas el módulo de Blogs habilitado.";
  }
  return error?.message || "No se pudo guardar la entrada del blog.";
}

export default function BlogsAdmin() {
  const { blogs, loading } = useBlogs();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("general"); // general, blocks, seo
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Auto-generar slug si se está creando y se tipea el título
  useEffect(() => {
    if (!editingId && form.title) {
      setForm((prev) => ({
        ...prev,
        slug: slugify(prev.title),
      }));
    }
  }, [form.title, editingId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setActiveTab("general");
    setFormError("");
    setIsEditorOpen(false);
    setPreviewOpen(false);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = (blog) => {
    setEditingId(blog.id);
    setForm({
      title: blog.title || "",
      slug: blog.slug || "",
      excerpt: blog.excerpt || "",
      coverImage: blog.coverImage || "",
      author: blog.author || BRAND_NAME,
      published: blog.published ?? false,
      tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : blog.tags || "",
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || "",
      canonicalUrl: blog.canonicalUrl || "",
      keywords: blog.keywords || "",
      contentBlocks: blog.contentBlocks || [{ type: "paragraph", text: "" }],
    });
    setIsEditorOpen(true);
    setActiveTab("general");
  };

  // Agregar bloque de contenido
  const addBlock = (type) => {
    setForm((prev) => {
      const newBlock =
        type === "paragraph"
          ? { type, text: "" }
          : type === "heading2" || type === "heading3"
          ? { type, text: "" }
          : type === "image"
          ? { type, url: "", caption: "" }
          : { type, items: [""] }; // type === "list"

      return {
        ...prev,
        contentBlocks: [...prev.contentBlocks, newBlock],
      };
    });
  };

  // Modificar bloque
  const updateBlock = (index, fields) => {
    setForm((prev) => {
      const newBlocks = [...prev.contentBlocks];
      newBlocks[index] = { ...newBlocks[index], ...fields };
      return { ...prev, contentBlocks: newBlocks };
    });
  };

  // Modificar ítem en bloque de lista
  const updateListItem = (blockIndex, itemIndex, val) => {
    setForm((prev) => {
      const newBlocks = [...prev.contentBlocks];
      const listItems = [...newBlocks[blockIndex].items];
      listItems[itemIndex] = val;
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], items: listItems };
      return { ...prev, contentBlocks: newBlocks };
    });
  };

  // Agregar ítem a bloque de lista
  const addListItem = (blockIndex) => {
    setForm((prev) => {
      const newBlocks = [...prev.contentBlocks];
      const listItems = [...newBlocks[blockIndex].items, ""];
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], items: listItems };
      return { ...prev, contentBlocks: newBlocks };
    });
  };

  // Eliminar ítem de bloque de lista
  const removeListItem = (blockIndex, itemIndex) => {
    setForm((prev) => {
      const newBlocks = [...prev.contentBlocks];
      const listItems = newBlocks[blockIndex].items.filter((_, i) => i !== itemIndex);
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], items: listItems };
      return { ...prev, contentBlocks: newBlocks };
    });
  };

  // Eliminar bloque
  const removeBlock = (index) => {
    setForm((prev) => {
      if (prev.contentBlocks.length === 1) return prev; // Mantener al menos un bloque
      return {
        ...prev,
        contentBlocks: prev.contentBlocks.filter((_, i) => i !== index),
      };
    });
  };

  // Reordenar bloques
  const moveBlock = (index, direction) => {
    setForm((prev) => {
      const blocks = [...prev.contentBlocks];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= blocks.length) return prev;

      // Swap
      const temp = blocks[index];
      blocks[index] = blocks[targetIndex];
      blocks[targetIndex] = temp;

      return { ...prev, contentBlocks: blocks };
    });
  };

  // Sugerir/Autocompletar SEO
  const handleAutoSEO = () => {
    const defaultMetaTitle = `${form.title.trim()} | ${BRAND_NAME}`;
    const defaultMetaDescription = form.excerpt.trim().slice(0, 160) || "Lee este artículo de blog oficial de nexastore, lo mejor en Once, Buenos Aires.";
    
    // Extraer palabras clave de tags y título
    const generatedKeywords = [
      ...form.tags.split(",").map(t => t.trim()),
      "once",
      "buenos aires",
      "cargadores",
      "electronica",
      "nexastore",
      "mayorista"
    ].filter(Boolean).slice(0, 8).join(", ");

    setForm((prev) => ({
      ...prev,
      metaTitle: defaultMetaTitle.slice(0, 60),
      metaDescription: defaultMetaDescription.slice(0, 160),
      keywords: generatedKeywords,
      canonicalUrl: `/blog/${prev.slug || slugify(prev.title)}`,
    }));
  };

  // Enviar formulario
  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("El título es obligatorio.");
      return;
    }
    if (!form.slug.trim()) {
      setFormError("El slug URL es obligatorio.");
      return;
    }
    if (!form.excerpt.trim()) {
      setFormError("El extracto/resumen es obligatorio.");
      return;
    }
    if (!form.coverImage) {
      setFormError("La imagen de portada es obligatoria para SEO.");
      return;
    }

    setSaving(true);
    
    // Formatear tags como array
    const tagsArray = form.tags
      ? form.tags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean)
      : [];

    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug.trim()),
      excerpt: form.excerpt.trim(),
      coverImage: form.coverImage,
      author: form.author.trim() || BRAND_NAME,
      published: Boolean(form.published),
      tags: tagsArray,
      metaTitle: form.metaTitle.trim() || `${form.title.trim()} | ${BRAND_NAME}`,
      metaDescription: form.metaDescription.trim() || form.excerpt.trim(),
      canonicalUrl: form.canonicalUrl.trim() || `/blog/${slugify(form.slug.trim())}`,
      keywords: form.keywords.trim() || tagsArray.join(", "),
      contentBlocks: form.contentBlocks,
      updatedAt: serverTimestamp(),
    };

    if (form.published) {
      payload.publishedAt = serverTimestamp();
    }

    try {
      if (editingId) {
        await setDoc(doc(db, "blogs", editingId), payload, { merge: false });
      } else {
        await addDoc(collection(db, "blogs"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err) {
      setFormError(getBlogWriteErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blogId) => {
    const ok = window.confirm("¿Seguro que deseas eliminar esta entrada de blog?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "blogs", blogId));
    } catch (err) {
      setFormError(getBlogWriteErrorMessage(err));
    }
  };

  // Filtrar posts
  const filteredBlogs = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return blogs.filter((blog) => {
      const text = `${blog.title || ""} ${blog.excerpt || ""} ${(blog.tags || []).join(" ")}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [blogs, query]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Módulo</p>
          <h2 className="text-3xl font-semibold mt-1">Blogs y Posicionamiento SEO</h2>
          <p className="text-sm text-white/50 mt-1">
            Redacta artículos optimizados semánticamente para rankear en Google para la zona de Once.
          </p>
        </div>
        {!isEditorOpen && (
          <button
            onClick={() => {
              setForm(emptyForm);
              setIsEditorOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] px-6 py-3 text-sm font-semibold tracking-[0.1em] uppercase hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
          >
            <Plus className="w-4 h-4" />
            Nuevo Artículo
          </button>
        )}
      </div>

      {isEditorOpen ? (
        /* ──── EDITOR DE ARTÍCULO ──── */
        <div className="grid gap-6">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-cyan-300" />
                <h3 className="text-xl font-medium">
                  {editingId ? "Editar Entrada de Blog" : "Nueva Entrada de Blog"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(!previewOpen)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                  <Eye className="w-4 h-4 text-cyan-300" />
                  {previewOpen ? "Cerrar Vista" : "Previsualizar"}
                </button>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {previewOpen ? (
              /* VISTA DE PREVISUALIZACIÓN */
              <div className="space-y-6 max-w-3xl mx-auto py-4 bg-[#0A0F1E] rounded-3xl p-6 md:p-8 border border-white/10 text-slate-300">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-semibold">
                  {form.tags || "Sin Etiquetas"}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mt-2">
                  {form.title || "Título del Artículo"}
                </h1>
                <p className="text-base md:text-lg text-slate-400 border-l-2 border-cyan-400 pl-4 py-1">
                  {form.excerpt || "Aquí aparecerá el resumen/extracto del artículo..."}
                </p>
                <div className="flex items-center gap-3 text-xs text-white/50 border-y border-white/5 py-3">
                  <span>Autor: <strong className="text-white">{form.author}</strong></span>
                  <span>•</span>
                  <span>Estado: <strong>{form.published ? "Publicado 🚀" : "Borrador ✏️"}</strong></span>
                </div>
                {form.coverImage && (
                  <div className="rounded-2xl overflow-hidden aspect-video border border-white/10 shadow-xl">
                    <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
                {/* RENDERIZADO DE BLOQUES */}
                <div className="space-y-6 mt-8 font-sans leading-relaxed">
                  {form.contentBlocks.map((block, idx) => {
                    if (block.type === "paragraph") {
                      return <p key={idx} className="text-base text-slate-300 whitespace-pre-wrap">{block.text || "Párrafo vacío..."}</p>;
                    }
                    if (block.type === "heading2") {
                      return <h2 key={idx} className="text-2xl font-semibold text-white tracking-tight mt-6">{block.text || "Subtítulo H2..."}</h2>;
                    }
                    if (block.type === "heading3") {
                      return <h3 key={idx} className="text-xl font-semibold text-white tracking-tight mt-4">{block.text || "Subtítulo H3..."}</h3>;
                    }
                    if (block.type === "image") {
                      return (
                        <div key={idx} className="space-y-2 mt-4">
                          {block.url ? (
                            <img src={block.url} alt={block.caption || "Imagen de Blog"} className="rounded-xl object-cover max-h-96 mx-auto" />
                          ) : (
                            <div className="h-40 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-xs text-white/40">Imagen no cargada</div>
                          )}
                          {block.caption && <p className="text-xs text-center text-slate-400">{block.caption}</p>}
                        </div>
                      );
                    }
                    if (block.type === "list") {
                      return (
                        <ul key={idx} className="list-disc list-inside space-y-1.5 pl-4 text-base text-slate-300">
                          {(block.items || []).map((li, i) => (
                            <li key={i}>{li || "Elemento de lista..."}</li>
                          ))}
                        </ul>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ) : (
              /* FORMULARIO EDITABLE */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tabs */}
                <div className="flex border-b border-white/10">
                  {[
                    { id: "general", label: "Información General", icon: FileText },
                    { id: "blocks", label: "Bloques de Contenido", icon: LayoutList },
                    { id: "seo", label: "Ajustes SEO y Meta", icon: Settings },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-medium transition ${
                          activeTab === tab.id
                            ? "border-cyan-400 text-cyan-200"
                            : "border-transparent text-white/50 hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* CONTENIDOS POR PESTAÑA */}
                {activeTab === "general" && (
                  <div className="space-y-4 grid md:grid-cols-[1.8fr_1.2fr] gap-6">
                    {/* Campos de texto izquierda */}
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.25em] text-white/60">Título del Artículo</span>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) => handleChange("title", e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/30"
                          placeholder="Los 5 Mejores Cargadores de Celular en Once [Guía Mayorista]"
                          required
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.25em] text-white/60">Slug URL amigable</span>
                          <input
                            type="text"
                            value={form.slug}
                            onChange={(e) => handleChange("slug", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none text-cyan-300 font-mono"
                            placeholder="mejores-cargadores-once-guia"
                            required
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.25em] text-white/60">Autor</span>
                          <input
                            type="text"
                            value={form.author}
                            onChange={(e) => handleChange("author", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                            placeholder={BRAND_NAME}
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.25em] text-white/60">Extracto / Resumen (SEO Meta-description)</span>
                        <textarea
                          value={form.excerpt}
                          onChange={(e) => handleChange("excerpt", e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/30 min-h-[90px]"
                          placeholder="Descubrí cuáles son los cargadores para celulares más duraderos y vendidos en Once. Te ofrecemos precios de fábrica y venta minorista..."
                          required
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.25em] text-white/60">Etiquetas (Separadas por coma)</span>
                          <input
                            type="text"
                            value={form.tags}
                            onChange={(e) => handleChange("tags", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                            placeholder="once, cargadores, ofertas, mayorista"
                          />
                        </label>
                        <div className="flex items-center h-full pt-6">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.published}
                              onChange={(e) => handleChange("published", e.target.checked)}
                              className="w-5 h-5 accent-cyan-400"
                            />
                            <div>
                              <span className="text-sm text-white font-medium">Publicar artículo</span>
                              <p className="text-xs text-white/50">Si se desmarca, se guardará como Borrador privado.</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Imagen de portada derecha */}
                    <div>
                      <ImageUploadField
                        label="Imagen de Portada (SEO y Grid)"
                        value={form.coverImage}
                        onChange={(val) => handleChange("coverImage", val)}
                      />
                      <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/50 space-y-2">
                        <p className="text-cyan-300 font-semibold uppercase tracking-[0.1em]">Recomendación SEO:</p>
                        <p>Sube imágenes de buena resolución en aspecto rectangular (ideal 1200x630px). Google la tomará para las tarjetas de búsqueda y redes sociales.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "blocks" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div>
                        <h4 className="text-sm font-semibold">Constructor Semántico por Bloques</h4>
                        <p className="text-xs text-white/50">Crea el texto del post intercalando headers, texto e imágenes para el mejor SEO técnico.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => addBlock("paragraph")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white uppercase tracking-[0.1em] font-semibold transition"
                        >
                          <Plus className="w-3.5 h-3.5 text-cyan-300" />
                          Párrafo
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlock("heading2")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white uppercase tracking-[0.1em] font-semibold transition"
                        >
                          <Heading2 className="w-3.5 h-3.5 text-cyan-300" />
                          H2 (Subtítulo)
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlock("heading3")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white uppercase tracking-[0.1em] font-semibold transition"
                        >
                          <Heading2 className="w-3.5 h-3.5 text-cyan-300 scale-90" />
                          H3 (Subtítulo)
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlock("image")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white uppercase tracking-[0.1em] font-semibold transition"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-300" />
                          Imagen
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlock("list")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white uppercase tracking-[0.1em] font-semibold transition"
                        >
                          <List className="w-3.5 h-3.5 text-cyan-300" />
                          Lista
                        </button>
                      </div>
                    </div>

                    {/* LISTA DE BLOQUES */}
                    <div className="space-y-4">
                      {form.contentBlocks.map((block, idx) => (
                        <div
                          key={idx}
                          className="group relative flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/30 transition"
                        >
                          {/* Controles de orden izquierda */}
                          <div className="flex flex-col gap-1.5 shrink-0 pt-2 opacity-50 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => moveBlock(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] text-center font-bold font-mono text-cyan-300">
                              {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => moveBlock(idx, "down")}
                              disabled={idx === form.contentBlocks.length - 1}
                              className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Editor del contenido del bloque */}
                          <div className="flex-1 min-w-0">
                            {block.type === "paragraph" && (
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Bloque de Párrafo</span>
                                <textarea
                                  value={block.text}
                                  onChange={(e) => updateBlock(idx, { text: e.target.value })}
                                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/20 min-h-[80px]"
                                  placeholder="Escribe aquí el párrafo..."
                                />
                              </div>
                            )}

                            {(block.type === "heading2" || block.type === "heading3") && (
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                  {block.type === "heading2" ? "Subtítulo H2 (Sección Principal)" : "Subtítulo H3 (Subsección)"}
                                </span>
                                <input
                                  type="text"
                                  value={block.text}
                                  onChange={(e) => updateBlock(idx, { text: e.target.value })}
                                  className={`mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 outline-none placeholder:text-white/20 font-semibold ${
                                    block.type === "heading2" ? "text-lg text-white" : "text-base text-cyan-100"
                                  }`}
                                  placeholder={block.type === "heading2" ? "Escribe un Subtítulo Principal H2..." : "Escribe un Subtítulo H3..."}
                                />
                              </div>
                            )}

                            {block.type === "image" && (
                              <div className="grid md:grid-cols-[1.5fr_1fr] gap-4">
                                <ImageUploadField
                                  label="Imagen del Bloque"
                                  value={block.url}
                                  onChange={(val) => updateBlock(idx, { url: val })}
                                />
                                <div className="space-y-3 pt-6">
                                  <label className="block">
                                    <span className="text-xs uppercase tracking-[0.2em] text-white/60">Texto Alt y Leyenda (Muy Importante SEO)</span>
                                    <input
                                      type="text"
                                      value={block.caption}
                                      onChange={(e) => updateBlock(idx, { caption: e.target.value })}
                                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none"
                                      placeholder="Ej: Auriculares Bluetooth Nexastore Once"
                                    />
                                  </label>
                                  <p className="text-[10px] text-white/40">
                                    El texto alternativo (`alt`) es crucial para que Google indexe la imagen y posicione el artículo en búsquedas visuales.
                                  </p>
                                </div>
                              </div>
                            )}

                            {block.type === "list" && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Bloque de Lista Viñetas</span>
                                <div className="space-y-2">
                                  {(block.items || []).map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center gap-2">
                                      <span className="text-cyan-300 font-bold">•</span>
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => updateListItem(idx, itemIdx, e.target.value)}
                                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none"
                                        placeholder="Ejemplo de ítem..."
                                      />
                                      {block.items.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeListItem(idx, itemIdx)}
                                          className="p-1.5 rounded hover:bg-white/10 text-red-300"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addListItem(idx)}
                                  className="inline-flex items-center gap-1 mt-2 text-xs text-cyan-300 hover:text-cyan-200 transition"
                                >
                                  <Plus className="w-3 h-3" /> Añadir ítem
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Botón de eliminar bloque derecha */}
                          <button
                            type="button"
                            onClick={() => removeBlock(idx)}
                            disabled={form.contentBlocks.length === 1}
                            className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition shrink-0 self-center disabled:opacity-20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Botones rápidos de agregar bloque al final */}
                    <div className="flex justify-center gap-3 border-t border-white/10 pt-6">
                      <button
                        type="button"
                        onClick={() => addBlock("paragraph")}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-cyan-300 font-medium transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Párrafo
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("heading2")}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-cyan-300 font-medium transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> H2
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("image")}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-cyan-300 font-medium transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Imagen
                      </button>
                      <button
                        type="button"
                        onClick={() => addBlock("list")}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-cyan-300 font-medium transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Lista
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "seo" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-cyan-400/5 p-4 rounded-2xl border border-cyan-400/20">
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-cyan-300" />
                          Asistente de Metadatos SEO
                        </h4>
                        <p className="text-xs text-white/50">
                          Asegúrate de llenar estos metadatos. Son la cara del sitio en el buscador de Google.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoSEO}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 text-[#0B1020] text-xs font-semibold uppercase tracking-[0.1em] hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/10"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Autocompletar
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                          Título Meta (Google - Max 60 car.)
                        </span>
                        <input
                          type="text"
                          value={form.metaTitle}
                          onChange={(e) => handleChange("metaTitle", e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/30"
                          placeholder="Título para buscadores"
                          maxLength={65}
                        />
                        <span className="text-[10px] text-white/35 mt-1 block">
                          Longitud: {form.metaTitle.length}/60 caracteres.
                        </span>
                      </label>

                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                          Keywords / Palabras Clave (Separadas por comas)
                        </span>
                        <input
                          type="text"
                          value={form.keywords}
                          onChange={(e) => handleChange("keywords", e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none"
                          placeholder="once, electronica, cargadores, precios"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                        Meta-Description (Buscadores - Max 160 car. Ideal para CTR)
                      </span>
                      <textarea
                        value={form.metaDescription}
                        onChange={(e) => handleChange("metaDescription", e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/30 min-h-[80px]"
                        placeholder="Descripción optimizada que aparece en los resultados de Google."
                        maxLength={170}
                      />
                      <span className="text-[10px] text-white/35 mt-1 block">
                        Longitud: {form.metaDescription.length}/160 caracteres.
                      </span>
                    </label>

                    <label className="block">
                      <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                        URL Canónica Personalizada (Opcional - Relativa)
                      </span>
                      <input
                        type="text"
                        value={form.canonicalUrl}
                        onChange={(e) => handleChange("canonicalUrl", e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none font-mono text-cyan-300/80"
                        placeholder="/blog/titulo-del-post"
                      />
                    </label>
                  </div>
                )}

                {formError && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {formError}
                  </div>
                )}

                {/* Botones de acción guardar/cancelar */}
                <div className="flex items-center gap-3 border-t border-white/10 pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0B1020] py-3 text-sm font-semibold tracking-[0.2em] uppercase hover:opacity-90 transition disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : editingId ? "Actualizar Artículo" : "Crear Artículo"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 rounded-2xl border border-white/15 text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* ──── LISTADO DE ARTÍCULOS ──── */
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Historial</p>
              <h3 className="text-2xl font-semibold mt-1">Artículos Publicados y Borradores</h3>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar artículo por título o tag..."
              className="w-full md:w-80 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/30"
            />
          </div>

          {loading ? (
            <div className="py-12 text-sm text-white/50 text-center">Cargando base de datos de blogs...</div>
          ) : filteredBlogs.length === 0 ? (
            <div className="py-12 text-sm text-white/50 text-center">
              No hay entradas cargadas. Hacé clic en "Nuevo Artículo" para arrancar.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 shrink-0 border border-white/10 shadow">
                      {blog.coverImage ? (
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/30">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-[0.2em] font-semibold ${
                            blog.published
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                          }`}
                        >
                          {blog.published ? "Publicado" : "Borrador"}
                        </span>
                        <span className="text-[10px] text-white/40">
                          Autor: {blog.author || BRAND_NAME}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold mt-1.5 text-white pr-4">
                        {blog.title}
                      </h4>
                      <p className="text-xs text-white/50 line-clamp-1 mt-1 pr-6 font-light">
                        {blog.excerpt}
                      </p>
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {blog.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[9px] bg-white/5 border border-white/10 text-cyan-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={() => handleEdit(blog)}
                      className="p-2.5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-cyan-400/40 text-cyan-300 hover:text-cyan-200 transition"
                      title="Editar entrada"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(blog.id)}
                      className="p-2.5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-red-500/40 text-red-300 hover:text-red-200 transition"
                      title="Eliminar entrada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
