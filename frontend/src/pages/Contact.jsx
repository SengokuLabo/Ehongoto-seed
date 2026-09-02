import ContactForm from "../components/ContactForm"
import { useNavigate } from "react-router-dom"

// お問い合わせフォーム
export default function Contact() {
  const navigate = useNavigate()

  return (
    <section className="contact">
      <div className='section_cont'>
        <ContactForm
          isModal={false}
          onClose={() => null}
        />
      </div>
    </section>
  )
}
