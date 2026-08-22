import React from 'react'
import { Typography, Tooltip, message } from 'antd'
import { m } from "@/src/i18n";
import type { ReactNode } from 'react'

export interface CopyableTextProps {
    text: string
    children?: ReactNode
    style?: React.CSSProperties
    tooltip?: string
}


const { Text } = Typography

const CopyableText: React.FC<CopyableTextProps> = ({ text, children, style, tooltip }) => {
    const [messageApi, contextHolder] = message.useMessage()

    const handleCopy = (e: React.MouseEvent | React.ClipboardEvent) => {
        e.preventDefault()
        e.stopPropagation()

        navigator.clipboard
            .writeText(text)
            .then(() => {
                messageApi.success(m.copyable_text_success())
            })
            .catch((err) => {
                console.error(`${m.copyable_text_failure()}:`, err)
                messageApi.error(m.copyable_text_failure())
            })
    }

    const content = (
        <Text style={{ cursor: 'pointer', ...style }} onCopy={handleCopy} onClick={handleCopy}>
            {children || text}
        </Text>
    )

    return (
        <>
            {contextHolder}
            {tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content}
        </>
    )
}

export default CopyableText
export { CopyableText }

