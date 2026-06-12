import { Link } from 'react-router-dom'

export default function Header() {
    return <nav id="nav">
        <Link to={`/`}>
            ↼ Back to search
        </Link>
    </nav>
}