import ModelForm from '../components/model_form';

export default function NewModelPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add New Model</h1>
        <p className="text-base-content/70">
          Configure a new AI model for the platform
        </p>
      </div>
      
      <ModelForm />
    </div>
  );
}