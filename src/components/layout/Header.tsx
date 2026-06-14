import { Link } from 'react-router-dom'

export default function Header() {
    return <nav id="nav">
        <Link to={`/`}>
            Vuizard
        </Link>
    </nav>
}