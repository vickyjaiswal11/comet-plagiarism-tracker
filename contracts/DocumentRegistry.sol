// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DocumentRegistry
 * @author VeriPlag / Comet
 * @notice Stores plagiarism-scan results as immutable linked blocks on-chain.
 *         Each submitted document produces one Block entry. Blocks are chained
 *         via prevHash so the entire ledger can be verified off-chain.
 *
 * Data stored per block:
 *   - docHash       : keccak256 of the raw document text
 *   - reportHash    : keccak256 of the serialised report payload
 *   - title         : document title (string)
 *   - author        : document author (string)
 *   - similarityPct : similarity score * 100 (uint16, e.g. 4250 = 42.50%)
 *   - riskLevel     : 0 = Clean, 1 = Moderate, 2 = High
 *   - submitter     : wallet address that registered the document
 *   - timestamp     : block.timestamp at registration
 *   - prevHash      : keccak256 of the previous block's data (genesis = 0x00)
 *   - blockIndex    : monotonically increasing index in this registry
 */
contract DocumentRegistry {
    /* ─────────────────────────────── Types ─────────────────────────────── */

    enum RiskLevel { Clean, Moderate, High }

    struct DocBlock {
        uint256 blockIndex;
        bytes32 docHash;
        bytes32 reportHash;
        bytes32 prevHash;
        string  title;
        string  author;
        uint16  similarityPct;  // similarity x 100 (avoids floats)
        RiskLevel riskLevel;
        address submitter;
        uint256 timestamp;
    }

    /* ─────────────────────────────── State ─────────────────────────────── */

    /// @notice Total number of documents registered.
    uint256 public blockCount;

    /// @notice Chain of all document blocks (index => DocBlock).
    mapping(uint256 => DocBlock) public chain;

    /// @notice Quick lookup: docHash => block index (first registration wins).
    mapping(bytes32 => uint256) public docHashToIndex;

    /// @notice Documents registered by each address.
    mapping(address => uint256[]) private _submitterBlocks;

    /* ─────────────────────────────── Events ─────────────────────────────── */

    event DocumentRegistered(
        uint256 indexed blockIndex,
        bytes32 indexed docHash,
        bytes32 reportHash,
        address indexed submitter,
        uint256 timestamp
    );

    /* ─────────────────────────── Constructor ────────────────────────────── */

    constructor() {
        blockCount = 0;
    }

    /* ─────────────────────────── Functions ─────────────────────────────── */

    /**
     * @notice Register a plagiarism-scan result as a new block in the chain.
     * @param docHash       keccak256 of the raw document text.
     * @param reportHash    keccak256 of the serialised report payload.
     * @param title         Document title.
     * @param author        Document author name.
     * @param similarityPct Similarity percentage x 100 (e.g. pass 4250 for 42.50%).
     * @param riskLevel     0 = Clean, 1 = Moderate, 2 = High.
     * @return index        The new block's index in the registry chain.
     */
    function registerDocument(
        bytes32 docHash,
        bytes32 reportHash,
        string calldata title,
        string calldata author,
        uint16 similarityPct,
        RiskLevel riskLevel
    ) external returns (uint256 index) {
        // Compute previous hash: hash of the last block's core fields.
        bytes32 prevHash = blockCount == 0
            ? bytes32(0)
            : _blockHash(blockCount - 1);

        index = blockCount;

        chain[index] = DocBlock({
            blockIndex:    index,
            docHash:       docHash,
            reportHash:    reportHash,
            prevHash:      prevHash,
            title:         title,
            author:        author,
            similarityPct: similarityPct,
            riskLevel:     riskLevel,
            submitter:     msg.sender,
            timestamp:     block.timestamp
        });

        // Only record first-time registrations for the same document.
        if (docHashToIndex[docHash] == 0 && index != 0) {
            docHashToIndex[docHash] = index;
        } else if (index == 0) {
            // Special handling for genesis block (index 0)
            docHashToIndex[docHash] = 0;
        }

        _submitterBlocks[msg.sender].push(index);
        blockCount++;

        emit DocumentRegistered(index, docHash, reportHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Verify the integrity of the entire chain.
     * @return valid True if every prevHash matches the previous block's hash.
     */
    function verifyChain() external view returns (bool valid) {
        if (blockCount == 0) return true;
        for (uint256 i = 1; i < blockCount; i++) {
            if (chain[i].prevHash != _blockHash(i - 1)) return false;
        }
        return true;
    }

    /**
     * @notice Get all block indices registered by a specific address.
     */
    function getSubmitterBlocks(address submitter)
        external
        view
        returns (uint256[] memory)
    {
        return _submitterBlocks[submitter];
    }

    /**
     * @notice Retrieve a single block by index.
     */
    function getBlock(uint256 index)
        external
        view
        returns (DocBlock memory)
    {
        require(index < blockCount, "DocumentRegistry: index out of range");
        return chain[index];
    }

    /**
     * @notice Retrieve a range of blocks [from, to) for pagination.
     */
    function getBlocks(uint256 from, uint256 to)
        external
        view
        returns (DocBlock[] memory blocks)
    {
        require(to <= blockCount, "DocumentRegistry: to out of range");
        require(from < to, "DocumentRegistry: empty range");
        blocks = new DocBlock[](to - from);
        for (uint256 i = from; i < to; i++) {
            blocks[i - from] = chain[i];
        }
    }

    /* ─────────────────────────── Internals ─────────────────────────────── */

    /**
     * @dev Deterministic hash of a block's immutable fields.
     *      Used to chain blocks together.
     */
    function _blockHash(uint256 index) internal view returns (bytes32) {
        DocBlock storage b = chain[index];
        return keccak256(abi.encodePacked(
            b.blockIndex,
            b.docHash,
            b.reportHash,
            b.prevHash,
            b.timestamp,
            b.submitter,
            b.similarityPct,
            uint8(b.riskLevel)
        ));
    }
}
