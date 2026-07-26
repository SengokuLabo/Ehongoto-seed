import ContactForm from "../components/ContactForm"
import { useNavigate } from "react-router-dom"

// お問い合わせフォーム
export default function Contact() {
  const navigate = useNavigate()

  return (
    <div className="contact">
      <ContactForm
        isModal={false}
        onClose={() => null}
      />
    </div>
  )
}
