import "./Home.css";
import Header from "./Header";
import Footer from "./Footer";

function PrivacyPolicy() {
  return (
    <div>
      <Header />

      <section className="section">
        <div className="certificate">
          <h3>Privacy Policy</h3>

          <p>
            Last updated: September 2026
          </p>

          <h4>1. Introduction</h4>
          <p>
            Mankind Minds respects your privacy. This policy explains what
            information is collected when you use this website, why it is
            collected, and how it is handled. It applies to the public Mankind
            Minds website, creator applications, and the tattoo studio map.
          </p>

          <h4>2. Information You Submit</h4>
          <p>
            If you apply to become verified, the application form may collect
            your name or creator name, email address, category, social media or
            portfolio link, information about your creative work, and your
            confirmations that the information and work are your own. Tattoo
            business applications may also collect your contact name, business
            name, and business email address.
          </p>

          <p>
            Applications are submitted to the Mankind Minds backend and stored
            in its Firestore database for review and communication by the
            Mankind Minds team. To prevent duplicate applications, we also
            create a pseudonymous fingerprint of the submitting network's IP
            address and retain it to enforce the permanent one-application
            limit. We do not store the raw IP address with the application.
            Account registration also stores your email, password hash, and
            creator profile information. Your profile is private while pending
            staff approval. Once approved, your display name, category, social
            platform and handle, and business name may appear on the public
            member directory. You may also provide a bio, profile picture, and
            portfolio photos; these remain private until staff approve your
            account. Password-reset links are sent by email.
          </p>

          <h4>3. Information Collected When You Browse</h4>
          <p>
            The website does not require an account and does not intentionally
            collect payment information, precise location, or government
            identification. It uses temporary browser session storage to
            remember the selected website section and to restore a page after
            navigation. This information remains in your browser session and is
            not submitted to Mankind Minds.
          </p>

          <p>
            The tattoo map uses map tiles supplied by CARTO, with map data from
            OpenStreetMap contributors. Your browser may connect to those
            providers to load the map.
           </p>

           <p>
            The website uses a first-party analytics system to understand how
            the site is used. When you browse the site, it creates a random
            anonymous visitor identifier in your browser's local storage and
            sends page-view information such as the page path, referring page,
            and screen width to our backend. This identifier is not your name,
            email address, or account identity, and we do not use it to contact
            or profile you.
          </p>

          <h4>4. Public Website Data</h4>
          <p>
            Creator profiles and tattoo studio listings shown on the website
            may contain names, descriptions, social links, images, locations,
            contact details, and other information supplied for publication.
            This information is public and may be copied or indexed by others.
          </p>

          <p>
            Public profile and studio information is retrieved from the Mankind
            Minds backend. We use it to display and maintain the directory,
            respond to enquiries, and operate the verification service.
          </p>

          <h4>5. How We Use Submitted Information</h4>
          <p>
            We use application information to review applications, assess
            submitted work and linked public content, contact applicants,
            manage verification records, prevent duplicate applications from
            the same IP address, and consider tattoo businesses for inclusion
            on the map. We do not sell application information.
          </p>

          <h4>6. Legal Basis</h4>
          <p>
            Where UK data protection law applies, we generally rely on steps
            taken at your request before providing a service, our legitimate
            interests in operating and protecting the website, and legal
            obligations. Where appropriate, we may rely on your consent.
          </p>

          <p>
            We may also review public websites and social profiles that you
            submit as part of an application. We only use them for the stated
            review and verification purposes.
          </p>

          <h4>7. Sharing and Service Providers</h4>
          <p>
            Application information is processed by our backend and stored in
            Firestore, a database service provided by Google Cloud. Uploaded
            account profile and portfolio photos are kept in a private Google
            Cloud Storage bucket and are served publicly only after account
            approval. Public
            website data is hosted and delivered through our website and
            backend hosting providers. We also send application details by
            email to our team using Gmail to notify them of new submissions.
            Map requests are handled by CARTO and OpenStreetMap-related
            services. These providers may process technical information such as
            an IP address as part of delivering their services.
          </p>

          <p>
            Analytics data is processed by our backend and stored in our
            Firestore database. We store aggregated counts rather than raw
            browsing histories or raw IP addresses. Any country or city
            information shown in the staff dashboard is approximate and is
            derived from available hosting metadata where possible. We do not
            use analytics to identify or contact individual visitors.
          </p>

          <h4>8. Security and Retention</h4>
          <p>
            We take reasonable technical and organisational measures to protect
            information against unauthorised access, loss, or misuse. No
            internet service can guarantee complete security.
          </p>

          <p>
            We keep application and verification information only for as long
            as reasonably necessary to review applications, maintain accurate
            records, handle disputes, and meet legal obligations. Public
            listings may remain online while they are relevant or until they
            are updated or removed.
          </p>

          <h4>9. Your Rights</h4>
          <p>
            Depending on where you live, you may have rights to request access
            to, correction of, or deletion of your personal information, or to
            object to or restrict certain processing. You may also have the
            right to withdraw consent where processing relies on consent.
          </p>

          <p>
            To make a privacy request, contact us using the details below. You
            may also complain to the Information Commissioner's Office (ICO) or
            your local data protection authority.
          </p>

          <h4>10. Contact</h4>
          <p>
            For privacy questions, requests, or concerns, please contact
            Mankind Minds:
          </p>

          <p>
            Email:{" "}
            <a href="mailto:admin@mankindminds.com">admin@mankindminds.com</a>
          </p>

          <h4>11. Changes to This Policy</h4>
          <p>
            We may update this policy when our services or data practices
            change. The latest version will be published on this page.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default PrivacyPolicy;
