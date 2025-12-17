import React, { useState, useEffect } from 'react';
import { FeedbackForm, FormResponse, FormAnswer } from '../types-forms';
import { Star, Send, CheckCircle } from 'lucide-react';

interface PublicFormProps {
  formId: string;
  forms: FeedbackForm[];
  onSubmit: (response: FormResponse) => void;
}

const PublicLegalFooter: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 shrink-0">
      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="text-[11px] font-medium text-zinc-400">© {new Date().getFullYear()} Scutch</div>
        <div className="flex gap-4 text-xs font-semibold text-zinc-400">
          <a href="/privacy" className="hover:text-zinc-950 transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-zinc-950 transition-colors">Terms</a>
          <a href="/impressum" className="hover:text-zinc-950 transition-colors">Site Notice</a>
        </div>
      </div>
    </footer>
  );
};

export const PublicForm: React.FC<PublicFormProps> = ({ formId, forms, onSubmit }) => {
  const [form, setForm] = useState<FeedbackForm | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: string | string[] }>({});
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ [questionId: string]: string }>({});

  useEffect(() => {
    const foundForm = forms.find(f => f.id === formId);
    if (foundForm && foundForm.isActive) {
      setForm(foundForm);
      // Initialize answers
      const initialAnswers: { [questionId: string]: string | string[] } = {};
      foundForm.questions.forEach(q => {
        if (q.type === 'checkbox') {
          initialAnswers[q.id] = [];
        } else {
          initialAnswers[q.id] = '';
        }
      });
      setAnswers(initialAnswers);
    }
  }, [formId, forms]);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!form) return false;
    
    const newErrors: { [questionId: string]: string } = {};
    
    // Check required questions
    form.questions.forEach(q => {
      if (q.required) {
        const answer = answers[q.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === 'string' && answer.trim() === '')) {
          newErrors[q.id] = 'This field is required';
        }
      }
      
      // Validate email format
      if (q.type === 'email' && answers[q.id]) {
        const emailValue = answers[q.id] as string;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
          newErrors[q.id] = 'Please enter a valid email address';
        }
      }
    });

    // Check if email is required by form settings
    if (form.settings.requireEmail && !email.trim()) {
      newErrors['__email__'] = 'Email is required';
    } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors['__email__'] = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form || !validateForm()) return;

    const formAnswers: FormAnswer[] = form.questions.map(q => ({
      questionId: q.id,
      value: answers[q.id]
    }));

    const response: FormResponse = {
      id: crypto.randomUUID(),
      formId: form.id,
      answers: formAnswers,
      submittedAt: new Date().toISOString(),
      respondentEmail: email || undefined,
      imported: false
    };

    onSubmit(response);
    setIsSubmitted(true);

    // Redirect if configured
    if (form.settings.redirectUrl) {
      setTimeout(() => {
        window.location.href = form.settings.redirectUrl!;
      }, 2000);
    }
  };

  const renderQuestion = (question: FeedbackForm['questions'][0]) => {
    const answer = answers[question.id];
    const error = errors[question.id];

    switch (question.type) {
      case 'short-text':
        return (
          <input
            type="text"
            value={answer as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder || 'Your answer...'}
            className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-rose-500' : 'border-zinc-300'} focus:border-zinc-950 focus:outline-none font-medium`}
          />
        );

      case 'long-text':
        return (
          <textarea
            value={answer as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder || 'Your answer...'}
            rows={4}
            className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-rose-500' : 'border-zinc-300'} focus:border-zinc-950 focus:outline-none font-medium`}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={answer as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder || 'your@email.com'}
            className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-rose-500' : 'border-zinc-300'} focus:border-zinc-950 focus:outline-none font-medium`}
          />
        );

      case 'rating':
        const maxStars = question.max || 5;
        return (
          <div className="flex gap-2">
            {Array.from({ length: maxStars }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAnswerChange(question.id, (i + 1).toString())}
                className="transition-all hover:scale-110"
              >
                <Star
                  size={32}
                  className={parseInt(answer as string) > i ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}
                />
              </button>
            ))}
          </div>
        );

      case 'nps':
        return (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAnswerChange(question.id, i.toString())}
                className={`w-12 h-12 rounded-lg border-2 font-bold transition-all ${
                  answer === i.toString()
                    ? 'bg-zinc-950 text-white border-zinc-950'
                    : 'border-zinc-300 hover:border-zinc-950'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        );

      case 'scale':
        const min = question.min || 1;
        const max = question.max || 5;
        return (
          <div className="flex gap-2">
            {Array.from({ length: max - min + 1 }, (_, i) => {
              const value = min + i;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleAnswerChange(question.id, value.toString())}
                  className={`w-12 h-12 rounded-lg border-2 font-bold transition-all ${
                    answer === value.toString()
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'border-zinc-300 hover:border-zinc-950'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        );

      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleAnswerChange(question.id, option)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  answer === option
                    ? 'bg-zinc-950 text-white border-zinc-950'
                    : 'border-zinc-300 hover:border-zinc-950'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => {
              const isChecked = Array.isArray(answer) && answer.includes(option);
              return (
                <label
                  key={index}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-300 hover:border-zinc-950 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const currentAnswers = answer as string[];
                      if (e.target.checked) {
                        handleAnswerChange(question.id, [...currentAnswers, option]);
                      } else {
                        handleAnswerChange(question.id, currentAnswers.filter(a => a !== option));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="font-medium">{option}</span>
                </label>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  if (!form) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-950 mb-2">Form Not Found</h2>
            <p className="text-zinc-500">This form is no longer available or has been deactivated.</p>
          </div>
        </div>
        <PublicLegalFooter />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-200 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-950 mb-2">Thank You!</h2>
            <p className="text-zinc-600 mb-4">Your feedback has been submitted successfully.</p>
            {form.settings.redirectUrl && (
              <p className="text-sm text-zinc-400">Redirecting...</p>
            )}
            {form.settings.showBranding && (
              <div className="mt-8 pt-6 border-t border-zinc-100">
                <p className="text-xs text-zinc-400">Powered by <span className="font-bold text-zinc-950">Scutch</span></p>
              </div>
            )}
          </div>
        </div>
        <PublicLegalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 md:p-12 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-950 mb-2">{form.name}</h1>
            {form.description && (
              <p className="text-zinc-600 text-lg">{form.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {form.questions
              .sort((a, b) => a.order - b.order)
              .map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <label className="block text-sm font-bold text-zinc-700 uppercase tracking-widest">
                    {question.question}
                    {question.required && <span className="text-rose-500 ml-1">*</span>}
                  </label>
                  {renderQuestion(question)}
                  {errors[question.id] && (
                    <p className="text-sm text-rose-600 font-medium">{errors[question.id]}</p>
                  )}
                </div>
              ))}

            {(form.settings.requireEmail || form.settings.allowAnonymous) && (
              <div className="space-y-2 pt-4 border-t border-zinc-100">
                <label className="block text-sm font-bold text-zinc-700 uppercase tracking-widest">
                  Email {form.settings.requireEmail && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors['__email__']) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors['__email__'];
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="your@email.com"
                  className={`w-full px-4 py-3 rounded-lg border ${errors['__email__'] ? 'border-rose-500' : 'border-zinc-300'} focus:border-zinc-950 focus:outline-none font-medium`}
                />
                {errors['__email__'] && (
                  <p className="text-sm text-rose-600 font-medium">{errors['__email__']}</p>
                )}
                {form.settings.allowAnonymous && !form.settings.requireEmail && (
                  <p className="text-xs text-zinc-400">Optional - leave blank to submit anonymously</p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg"
            >
              <Send size={20} />
              Submit Feedback
            </button>
          </form>

          {form.settings.showBranding && (
            <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
              <p className="text-xs text-zinc-400">Powered by <span className="font-bold text-zinc-950">Scutch</span></p>
            </div>
          )}
          </div>
        </div>
      </div>

      <PublicLegalFooter />
    </div>
  );
};
