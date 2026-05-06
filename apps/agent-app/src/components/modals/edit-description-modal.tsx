import { useState, useEffect } from "react";
import { StandardModal, StandardModalFooter, MandatoryFieldsNote } from "@/components/ui/standard-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";

interface DescriptionTranslation {
  text: string;
  language: string;
  flag: string;
}

interface EditDescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDescription: { translations: DescriptionTranslation[] } | null;
  onSave: (description: { translations: DescriptionTranslation[] }) => void;
}

const MAX_CHARACTERS = 4000;

const languages = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', required: true },
  { code: 'en', name: 'English', flag: '🇬🇧', required: false },
];

export function EditDescriptionModal({ 
  open, 
  onOpenChange, 
  currentDescription,
  onSave 
}: EditDescriptionModalProps) {
  const [translations, setTranslations] = useState<Record<string, string>>({
    es: '',
    en: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState<Record<string, boolean>>({});

  // Initialize form with current values when modal opens
  useEffect(() => {
    if (open && currentDescription) {
      const newTranslations: Record<string, string> = { es: '', en: '' };
      currentDescription.translations.forEach((t) => {
        if (t.language === 'Spanish') newTranslations.es = t.text;
        if (t.language === 'English') newTranslations.en = t.text;
      });
      setTranslations(newTranslations);
    } else if (open && !currentDescription) {
      setTranslations({ es: '', en: '' });
    }
  }, [open, currentDescription]);

  // Spanish is required
  const isFormValid = translations.es.trim().length > 0;

  const handleTextChange = (langCode: string, text: string) => {
    if (text.length <= MAX_CHARACTERS) {
      setTranslations(prev => ({ ...prev, [langCode]: text }));
    }
  };

  const handleGenerateAI = async (langCode: string) => {
    setGeneratingAI(prev => ({ ...prev, [langCode]: true }));
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sampleText = langCode === 'es' 
      ? 'Luminoso apartamento de 3 dormitorios con dos baños completos, cocina moderna totalmente equipada y amplio balcón con vistas despejadas en el prestigioso barrio de Chamberí. Esta propiedad excepcional ofrece una oportunidad única para familias o profesionales que buscan comodidad y estilo en una de las ubicaciones más privilegiadas de Madrid.'
      : 'Bright 3-bedroom apartment with two full bathrooms, fully equipped modern kitchen and spacious balcony with unobstructed views in the prestigious Chamberí neighborhood. This exceptional property offers a unique opportunity for families or professionals seeking comfort and style in one of Madrid\'s most privileged locations.';
    
    setTranslations(prev => ({ ...prev, [langCode]: sampleText }));
    setGeneratingAI(prev => ({ ...prev, [langCode]: false }));
  };

  const handleSave = () => {
    if (!isFormValid) return;

    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      const descriptionData: { translations: DescriptionTranslation[] } = {
        translations: []
      };

      if (translations.es.trim()) {
        descriptionData.translations.push({
          text: translations.es.trim(),
          language: 'Spanish',
          flag: '🇪🇸'
        });
      }

      if (translations.en.trim()) {
        descriptionData.translations.push({
          text: translations.en.trim(),
          language: 'English',
          flag: '🇬🇧'
        });
      }

      onSave(descriptionData);
      setIsSaving(false);
      onOpenChange(false);
    }, 1500);
  };

  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false);
    }
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSaving]);

  return (
    <StandardModal
      open={open}
      onOpenChange={handleClose}
      title="Description"
      description={<MandatoryFieldsNote />}
      size="2xl"
      preventClose={isSaving}
      footer={
        <StandardModalFooter
          label="Save"
          loadingLabel="Saving..."
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!isFormValid}
        />
      }
    >
      <div className="space-y-6 pb-2">
        {languages.map((lang) => (
          <div key={lang.code} className="space-y-2">
            {/* Language Label */}
            <div className="flex items-center gap-2">
              <span className="font-medium">{lang.name}</span>
              <span>{lang.flag}</span>
              {lang.required && <span className="text-destructive">*</span>}
            </div>

            {/* Textarea */}
            <Textarea
              value={translations[lang.code]}
              onChange={(e) => handleTextChange(lang.code, e.target.value)}
              placeholder=""
              className="min-h-[200px] resize-none rounded-xl text-base"
              disabled={generatingAI[lang.code]}
            />

            {/* Footer with AI button and character counter */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleGenerateAI(lang.code)}
                disabled={generatingAI[lang.code]}
                className="gap-2 rounded-full"
              >
                {generatingAI[lang.code] ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate using AI
                  </>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                {translations[lang.code].length.toLocaleString()}/{MAX_CHARACTERS.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </StandardModal>
  );
}
