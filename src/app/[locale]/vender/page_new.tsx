// Deprecated - use ./page.tsx instead
// This file exists for backward compatibility only
        description: 'Un agente se pondrá en contacto contigo pronto para una valoración profesional.'
      setStep(1);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Error al enviar solicitud', {
        description: error.message || 'Por favor, inténtalo de nuevo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative py-32 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-lime-50 to-teal-50 dark:from-lime-950/20 dark:to-teal-950/20 opacity-50" />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="text-[10px] tracking-[0.5em] uppercase text-slate-400 mb-6 block">
            Tasación Instantánea
          </span>
          <h1 className="text-5xl md:text-7xl font-serif mb-8 text-[#0a192f] dark:text-white leading-tight">
            ¿Cuánto vale tu <br />
            <span className="italic pr-4 bg-clip-text text-transparent bg-gradient-to-r from-lime-500 to-teal-500">
              propiedad
            </span>?
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
            Descubre el valor de mercado de tu inmueble en segundos con datos oficiales del Catastro.
          </p>
        </div>
      </section>

      {/* Steps Indicator */}
      <StepsIndicator currentStep={step} showPisoStep={isPisoOrApartamento} />

      {/* Content */}
      <div className="py-12">
        {/* STEP 1: Tipo de operación */}
        {step === 1 && (
          <OperationTypeStep
            formState={formState}
            setFormState={setFormState}
            onNext={handleNextStep}
          />
        )}

        {/* STEP 2: Tipo de bien */}
        {step === 2 && (
          <PropertyTypeStep
            formState={formState}
            setFormState={setFormState}
            onNext={handleNextStep}
            onBack={handleBackStep}
          />
        )}

        {/* STEP 3: Dirección */}
        {step === 3 && (
          <AddressSearchStep
            formState={formState}
            setFormState={setFormState}
            onNext={handleNextStep}
            onBack={handleBackStep}
            onPropertyFound={handlePropertyFound}
            loading={loading}
          />
        )}

        {/* STEP 4: Detalles de piso (condicional) */}
        {step === 4 && isPisoOrApartamento && (
          <PropertyDetailsStep
            formState={formState}
            setFormState={setFormState}
            onNext={handleNextStep}
            onBack={handleBackStep}
          />
        )}

        {/* STEP 5: Revisión */}
        {step === (isPisoOrApartamento ? 5 : 4) && formState.propertyFromCatastro && (
          <PropertyReviewStep
            formState={formState}
            setFormState={setFormState}
            onNext={handleNextStep}
            onBack={handleBackStep}
          />
        )}

        {/* STEP 6: Contacto */}
        {step === totalSteps && (
          <ContactFormStep
            formState={formState}
            setFormState={setFormState}
            onSubmit={handleSubmitContact}
            onBack={handleBackStep}
            loading={loading}
          />
        )}
      </div>

      {/* Footer */}
      <section className="py-20 px-8 bg-slate-900 dark:bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-serif mb-6">¿Preguntas?</h2>
          <p className="text-slate-300 mb-8">
            Nuestro equipo está disponible para ayudarte en el proceso de valoración
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <a
              href="tel:+34961234567"
              className="px-8 py-3 bg-lime-400 text-slate-900 rounded-lg font-medium hover:bg-lime-500 transition-colors"
            >
              Llamar ahora
            </a>
            <a
              href="mailto:info@vidahome.es"
              className="px-8 py-3 border border-white rounded-lg font-medium hover:bg-white hover:text-slate-900 transition-colors"
            >
              Enviar email
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
