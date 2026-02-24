"use client";

import React, { useState, useEffect } from "react";
import {
  translatePropertiesAction,
  updateTranslationAction,
} from "@/app/actions/translate-perplexity";

interface PropertyTranslation {
  cod_ofer: number;
  descriptions: {
    description_es?: string;
    description_en?: string;
    description_fr?: string;
    description_de?: string;
    description_it?: string;
    description_pl?: string;
  };
}

export function TranslationsEditor() {
  const [properties, setProperties] = useState<PropertyTranslation[]>([]);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLang, setEditingLang] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [message, setMessage] = useState("");

  const languages = [
    { code: "en", name: "English" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pl", name: "Polish" },
  ];

  // Load properties from Supabase
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/translations");
        if (!response.ok) throw new Error("Failed to load properties");
        const data = await response.json();
        setProperties(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setMessage(`Error: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  // Handle translation action
  const handleTranslate = async () => {
    try {
      setTranslating(true);
      setMessage("Translating...");

      const result = await translatePropertiesAction(undefined, 10);

      if (result.errors > 0) {
        setMessage(
          `Translated: ${result.translated}, Errors: ${result.errors}. Cost: ${result.cost_estimate}`
        );
      } else {
        setMessage(
          `Successfully translated ${result.translated} properties. Cost: ${result.cost_estimate}`
        );
        // Reload properties
        const response = await fetch("/api/admin/translations");
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setMessage(`Translation error: ${message}`);
    } finally {
      setTranslating(false);
    }
  };

  // Handle manual translation edit
  const handleSaveEdit = async () => {
    if (!editingId || !editingLang) return;

    try {
      setLoading(true);
      const result = await updateTranslationAction(
        editingId,
        editingLang,
        editingText
      );

      if (!result.success) {
        setMessage(`Error: ${result.error}`);
        return;
      }

      setMessage("Translation updated successfully");
      setEditingId(null);
      setEditingLang(null);
      setEditingText("");

      // Reload properties
      const response = await fetch("/api/admin/translations");
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setMessage(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cod_ofer: number, lang: string, text: string) => {
    setEditingId(cod_ofer);
    setEditingLang(lang);
    setEditingText(text);
  };

  if (loading && properties.length === 0) {
    return <div className="p-4">Loading translations...</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Translations Editor</h2>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
          {message}
        </div>
      )}

      <button
        onClick={handleTranslate}
        disabled={translating || loading}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {translating ? "Translating..." : "Translate All Properties"}
      </button>

      <div className="grid gap-4">
        {properties.map((prop) => (
          <div key={prop.cod_ofer} className="border border-gray-300 p-4 rounded">
            <h3 className="text-lg font-semibold mb-3">
              Property {prop.cod_ofer}
            </h3>

            <div className="mb-4">
              <h4 className="font-bold text-gray-700 mb-2">Spanish (Source)</h4>
              <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                {prop.descriptions.description_es || "No Spanish description"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {languages.map((lang) => {
                const translationKey =
                  `description_${lang.code}` as keyof typeof prop.descriptions;
                const currentTranslation =
                  prop.descriptions[translationKey] || "";
                const isEditing =
                  editingId === prop.cod_ofer && editingLang === lang.code;

                return (
                  <div
                    key={lang.code}
                    className="border border-gray-200 p-3 rounded"
                  >
                    <h4 className="font-bold text-sm text-gray-700 mb-2">
                      {lang.name}
                    </h4>

                    {isEditing ? (
                      <div>
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full h-20 border border-gray-300 rounded p-2 text-sm"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={loading}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingLang(null);
                            }}
                            className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-700 mb-2">
                          {currentTranslation || (
                            <span className="italic text-gray-400">
                              No translation yet
                            </span>
                          )}
                        </p>
                        <button
                          onClick={() =>
                            startEdit(
                              prop.cod_ofer,
                              lang.code,
                              currentTranslation
                            )
                          }
                          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
