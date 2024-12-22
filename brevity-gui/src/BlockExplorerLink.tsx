function BlockExplorerLink(address: string) {
    const url = 'https://gnosisscan.io/address/'+address
    return <a href={url}>{address}</a>
}

export default BlockExplorerLink