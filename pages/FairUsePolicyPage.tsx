import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-2xl font-bold text-[#1f2937] mb-4">{title}</h3>
    <div className="prose prose-lg max-w-none text-[#374151] space-y-4">
      {children}
    </div>
  </div>
);

export const FairUsePolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),_0_10px_10px_-5px_rgba(0,0,0,0.04)] border border-[#e5e7eb]">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-[#1f2937] sm:text-5xl">
          Fair Use Policy
        </h2>
        <p className="mt-4 text-lg text-[#6b7280]">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Section title="1. Philosophy and Purpose">
        <p>
          Our "Business" plan offers unlimited redesigns to provide maximum value and creative freedom for our customers. This policy is designed to prevent fraud and abuse of our services by a small number of users. The vast majority of our customers will never be affected by this policy. The purpose is to ensure a high-quality, responsive, and available service for everyone.
        </p>
      </Section>
      
      <Section title="2. Permitted Use">
        <p>
          The unlimited plan is intended for normal business or professional use. This includes, but is not limited to:
        </p>
        <ul>
            <li>Generating multiple design concepts for your own property.</li>
            <li>Generating design concepts for clients as part of a professional landscaping, architectural, or design service.</li>
            <li>Experimenting with different styles, features, and climates for various projects.</li>
        </ul>
      </Section>
      
      <Section title="3. Prohibited Uses">
        <p>
          We may consider your usage to be in violation of our Fair Use Policy if you engage in any of the following activities:
        </p>
         <ul>
            <li><strong>Automated or Programmatic Access:</strong> Using bots, scripts, or any other automated processes to generate images without direct human interaction.</li>
            <li><strong>Data Mining and Scraping:</strong> Using the service to systematically download or store large volumes of design data or images for purposes other than direct project work.</li>
            <li><strong>Resale of Service Access:</strong> Reselling, sublicensing, or otherwise providing access to your "unlimited" account to third parties.</li>
            <li><strong>Excessive, Unattended Usage:</strong> Initiating an extremely high number of redesigns in a short period that suggests non-interactive, automated use, which could degrade the service for other users.</li>
            <li><strong>Sharing Accounts:</strong> Sharing your account credentials with individuals outside of your organization.</li>
        </ul>
      </Section>
      
      <Section title="4. Consequences of Misuse">
        <p>
          If we determine that a user is violating this Fair Use Policy, we will take action to mitigate the impact. We will typically begin by contacting the user to understand their use case and provide guidance. In cases of clear and repeated abuse, we reserve the right to temporarily suspend or, in severe cases, terminate the user's account to protect our service and other users. We will always attempt to make contact before taking any drastic action.
        </p>
      </Section>
    </div>
  );
};
