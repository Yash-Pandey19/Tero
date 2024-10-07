import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.*;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

@WebServlet("/compress")
public class CompressionServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        Part filePart = request.getPart("file"); // Get uploaded file
        BufferedReader reader = new BufferedReader(new InputStreamReader(filePart.getInputStream()));

        StringBuilder text = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            text.append(line).append("\n");
        }

        // Huffman compress the file content
        byte[] compressedData = compressHuffman(text.toString());

        // Return the compressed file
        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition", "attachment; filename=\"compressed.huff\"");
        response.getOutputStream().write(compressedData);
    }

    // Helper class and methods for Huffman compression

    class Node implements Comparable<Node> {
        char ch;
        int freq;
        Node left, right;

        Node(char ch, int freq, Node left, Node right) {
            this.ch = ch;
            this.freq = freq;
            this.left = left;
            this.right = right;
        }

        public int compareTo(Node that) {
            return this.freq - that.freq;
        }
    }

    private byte[] compressHuffman(String text) throws IOException {
        // Frequency map
        Map<Character, Integer> freqMap = new HashMap<>();
        for (char ch : text.toCharArray()) {
            freqMap.put(ch, freqMap.getOrDefault(ch, 0) + 1);
        }

        // Build Huffman tree
        PriorityQueue<Node> pq = new PriorityQueue<>();
        for (Map.Entry<Character, Integer> entry : freqMap.entrySet()) {
            pq.add(new Node(entry.getKey(), entry.getValue(), null, null));
        }

        while (pq.size() > 1) {
            Node left = pq.poll();
            Node right = pq.poll();
            Node parent = new Node('\0', left.freq + right.freq, left, right);
            pq.add(parent);
        }

        Node root = pq.poll();
        Map<Character, String> huffmanCodes = new HashMap<>();
        buildCodes(huffmanCodes, root, "");

        StringBuilder encodedText = new StringBuilder();
        for (char ch : text.toCharArray()) {
            encodedText.append(huffmanCodes.get(ch));
        }

        return encodedText.toString().getBytes();
    }

    private void buildCodes(Map<Character, String> huffmanCodes, Node node, String code) {
        if (node == null) return;
        if (node.left == null && node.right == null) {
            huffmanCodes.put(node.ch, code);
        }
        buildCodes(huffmanCodes, node.left, code + '0');
        buildCodes(huffmanCodes, node.right, code + '1');
    }
}
