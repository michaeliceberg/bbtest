type Props= {
    children: React.ReactNode

}
const RandomFireLayout = ({children} : Props) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col h-full w-full">
                {children}
            </div>

        </div>
    )
}

export default RandomFireLayout